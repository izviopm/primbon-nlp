-- Primbon NLP v1 schema. See PRD.md section 9.

-- ============ Users ============

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  role text not null default 'user' check (role in ('admin', 'user', 'guest')),
  full_name text check (length(trim(full_name)) between 1 and 100),
  gender text check (gender in ('male', 'female')),
  avatar_path text, -- object path in the "avatars" bucket; null = default avatar by gender
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Security definer so policies on profiles can call them without recursing into profiles' own RLS.
create function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create function public.is_guest() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'guest');
$$;

alter table public.profiles enable row level security;
create policy "own or admin read" on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));
-- Users edit only name, gender, and photo of their own row. The shared guest account edits nothing (PRD 7).
revoke update on public.profiles from authenticated;
grant update (full_name, gender, avatar_path) on public.profiles to authenticated;
create policy "own profile update" on public.profiles for update to authenticated
  using (id = (select auth.uid()) and not (select public.is_guest()))
  with check (id = (select auth.uid()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "avatar insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and not (select public.is_guest()));
create policy "avatar update own folder" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and not (select public.is_guest()));
create policy "avatar delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = (select auth.uid())::text and not (select public.is_guest()));

-- ============ Pengetahuan primbon (PRD 5.5), isi di migration seed ============

create table public.hari (
  nama text primary key,
  neptu int not null,
  urutan int not null unique check (urutan between 0 and 6) -- 0 = minggu, sama dengan extract(dow)
);

create table public.pasaran (
  nama text primary key,
  neptu int not null,
  urutan int not null unique check (urutan between 0 and 4) -- 0 = legi (17 Agustus 1945 = Jumat Legi)
);

create table public.jodoh (
  sisa int primary key check (sisa between 0 and 8), -- (neptu_1 + neptu_2) mod 9
  nama text not null,
  arti text not null,
  sumber text not null
);

create table public.watak (
  hari text not null references public.hari,
  pasaran text not null references public.pasaran,
  deskripsi text not null,
  sumber text not null,
  primary key (hari, pasaran)
);

alter table public.hari enable row level security;
alter table public.pasaran enable row level security;
alter table public.jodoh enable row level security;
alter table public.watak enable row level security;
create policy "read" on public.hari for select to authenticated using (true);
create policy "read" on public.pasaran for select to authenticated using (true);
create policy "read" on public.jodoh for select to authenticated using (true);
create policy "read" on public.watak for select to authenticated using (true);

-- ============ Fungsi query Translator (PRD 5.4) ============
-- Isi fungsi ini sama dengan teks SQL di src/lib/nlp/translator.ts (di sini dengan prefix schema).
-- Semua nilai masuk sebagai parameter; tidak ada SQL dinamis.

create function public.weton_dari(p_hari text, p_pasaran text, p_tanggal date)
returns table (hari text, pasaran text, neptu_hari int, neptu_pasaran int, neptu int)
language sql stable set search_path = '' as $$
  select h.nama, p.nama, h.neptu, p.neptu, h.neptu + p.neptu
  from public.hari h, public.pasaran p
  where (p_tanggal is null and h.nama = p_hari and p.nama = p_pasaran)
     or (p_tanggal is not null
         and h.urutan = extract(dow from p_tanggal)
         and p.urutan = mod(mod(p_tanggal - date '1945-08-17', 5) + 5, 5));
$$;

create function public.primbon_weton(p_tanggal date)
returns table (hari text, pasaran text, neptu_hari int, neptu_pasaran int, neptu int)
language sql stable set search_path = '' as $$
  select w.hari, w.pasaran, w.neptu_hari, w.neptu_pasaran, w.neptu
  from public.weton_dari(null, null, p_tanggal) w;
$$;

create function public.primbon_neptu(p_hari text, p_pasaran text, p_tanggal date)
returns table (hari text, pasaran text, neptu_hari int, neptu_pasaran int, neptu int)
language sql stable set search_path = '' as $$
  select w.hari, w.pasaran, w.neptu_hari, w.neptu_pasaran, w.neptu
  from public.weton_dari(p_hari, p_pasaran, p_tanggal) w;
$$;

create function public.primbon_jodoh(
  p_hari_1 text, p_pasaran_1 text, p_tanggal_1 date,
  p_hari_2 text, p_pasaran_2 text, p_tanggal_2 date)
returns table (hari_1 text, pasaran_1 text, neptu_1 int, hari_2 text, pasaran_2 text, neptu_2 int,
               jumlah int, sisa int, nama text, arti text, sumber text)
language sql stable set search_path = '' as $$
  select a.hari, a.pasaran, a.neptu, b.hari, b.pasaran, b.neptu,
         a.neptu + b.neptu, j.sisa, j.nama, j.arti, j.sumber
  from public.weton_dari(p_hari_1, p_pasaran_1, p_tanggal_1) a,
       public.weton_dari(p_hari_2, p_pasaran_2, p_tanggal_2) b,
       public.jodoh j
  where j.sisa = mod(a.neptu + b.neptu, 9);
$$;

create function public.primbon_watak(p_hari text, p_pasaran text, p_tanggal date)
returns table (hari text, pasaran text, neptu int, deskripsi text, sumber text)
language sql stable set search_path = '' as $$
  select w.hari, w.pasaran, w.neptu, k.deskripsi, k.sumber
  from public.weton_dari(p_hari, p_pasaran, p_tanggal) w
  join public.watak k on k.hari = w.hari and k.pasaran = w.pasaran;
$$;

create function public.primbon_kapan(p_hari text, p_pasaran text, p_mulai date, p_selesai date)
returns table (tanggal date)
language sql stable set search_path = '' as $$
  select d::date
  from generate_series(p_mulai::timestamp, p_selesai::timestamp, interval '1 day') as d
  join public.hari h on h.urutan = extract(dow from d)
  join public.pasaran p on p.urutan = mod(mod(d::date - date '1945-08-17', 5) + 5, 5)
  where h.nama = p_hari and p.nama = p_pasaran
    and p_selesai - p_mulai <= 400 -- pencarian maksimal sekitar setahun
  order by d;
$$;

revoke execute on function public.weton_dari(text, text, date) from public, anon;
revoke execute on function public.primbon_weton(date) from public, anon;
revoke execute on function public.primbon_neptu(text, text, date) from public, anon;
revoke execute on function public.primbon_jodoh(text, text, date, text, text, date) from public, anon;
revoke execute on function public.primbon_watak(text, text, date) from public, anon;
revoke execute on function public.primbon_kapan(text, text, date, date) from public, anon;
grant execute on function public.weton_dari(text, text, date) to authenticated;
grant execute on function public.primbon_weton(date) to authenticated;
grant execute on function public.primbon_neptu(text, text, date) to authenticated;
grant execute on function public.primbon_jodoh(text, text, date, text, text, date) to authenticated;
grant execute on function public.primbon_watak(text, text, date) to authenticated;
grant execute on function public.primbon_kapan(text, text, date, date) to authenticated;

-- ============ AI settings, quota, logs (PRD 6, 9) ============

create table public.ai_settings (
  id boolean primary key default true check (id), -- singleton
  base_url text,
  model text,
  api_key_secret_id uuid, -- vault.secrets id; the key itself lives encrypted in Supabase Vault
  updated_at timestamptz not null default now()
);
insert into public.ai_settings (id) values (true);

create table public.app_settings (
  key text primary key,
  value jsonb not null
);
insert into public.app_settings (key, value) values
  ('ai_models', '{"models": []}'), -- backup models in order, [{id, name}]
  ('limits', '{"per_user_per_day": 50, "guest_per_day": 30, "global_per_day": 1000, "ai_enabled": true}');

create table public.ai_usage (
  user_id uuid not null references auth.users on delete cascade,
  day date not null,
  calls int not null default 0,
  primary key (user_id, day)
);

create table public.query_logs (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users on delete set null,
  created_at timestamptz not null default now(),
  input text not null,
  kalimat_baku text,
  jenis_kalimat text,
  sumber text not null check (sumber in ('rule', 'rule_ai', 'mbah', 'gagal')),
  model text,
  durasi_ms int
);
create index query_logs_created_idx on public.query_logs (created_at desc);

alter table public.ai_settings enable row level security;
alter table public.app_settings enable row level security;
alter table public.ai_usage enable row level security;
alter table public.query_logs enable row level security;
create policy "admin all" on public.ai_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin all" on public.app_settings for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "own or admin read" on public.ai_usage for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
create policy "admin read" on public.query_logs for select to authenticated
  using ((select public.is_admin()));

-- Atomically checks the kill switch, the role's daily limit, and the global cap, then records one call.
-- Days follow Asia/Jakarta, not the database's UTC clock.
create function public.consume_ai_quota(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_limits jsonb;
  v_role text;
  v_limit int;
  v_used int;
begin
  perform pg_advisory_xact_lock(hashtext('ai_usage'));
  select value into v_limits from public.app_settings where key = 'limits';
  if not coalesce((v_limits->>'ai_enabled')::boolean, true) then raise exception 'AI_DISABLED'; end if;

  select coalesce(sum(calls), 0) into v_used from public.ai_usage where day = v_today;
  if (v_limits->>'global_per_day') is not null and v_used + 1 > (v_limits->>'global_per_day')::int then
    raise exception 'GLOBAL_LIMIT';
  end if;

  select role into v_role from public.profiles where id = p_user_id;
  if v_role is distinct from 'admin' then
    v_limit := (v_limits->>(case when v_role = 'guest' then 'guest_per_day' else 'per_user_per_day' end))::int;
    select coalesce(calls, 0) into v_used from public.ai_usage where user_id = p_user_id and day = v_today;
    if v_limit is not null and coalesce(v_used, 0) + 1 > v_limit then
      raise exception '%', case when v_role = 'guest' then 'GUEST_LIMIT' else 'USER_LIMIT' end;
    end if;
  end if;

  insert into public.ai_usage as u (user_id, day, calls) values (p_user_id, v_today, 1)
  on conflict (user_id, day) do update set calls = u.calls + 1;
end $$;

create function public.set_ai_api_key(p_key text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not public.is_admin() then raise exception 'FORBIDDEN'; end if;
  select api_key_secret_id into v_id from public.ai_settings where id;
  if v_id is null then
    v_id := vault.create_secret(p_key, 'primbon_ai_api_key');
    update public.ai_settings set api_key_secret_id = v_id, updated_at = now() where id;
  else
    perform vault.update_secret(v_id, p_key);
    update public.ai_settings set updated_at = now() where id;
  end if;
end $$;

create function public.get_ai_api_key() returns text
language sql stable security definer set search_path = '' as $$
  select ds.decrypted_secret from vault.decrypted_secrets ds
  join public.ai_settings s on s.api_key_secret_id = ds.id where s.id;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_guest() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.is_guest() to authenticated;
revoke execute on function public.consume_ai_quota(uuid) from public, anon, authenticated;
revoke execute on function public.get_ai_api_key() from public, anon, authenticated;
revoke execute on function public.set_ai_api_key(text) from public, anon;
grant execute on function public.consume_ai_quota(uuid) to service_role;
grant execute on function public.get_ai_api_key() to service_role;
grant execute on function public.set_ai_api_key(text) to authenticated;
