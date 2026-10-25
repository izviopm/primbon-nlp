-- Per-user AI limits set by the admin (PRD 7, 9). Admins are always unlimited.

create table public.user_limits (
  user_id uuid primary key references auth.users on delete cascade,
  ai_calls_per_day int check (ai_calls_per_day >= 0), -- null = role default from app_settings.limits
  unlimited boolean not null default false,
  set_by uuid references auth.users on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.user_limits enable row level security;
create policy "admin all" on public.user_limits for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Resolution: kill switch (everyone) → admin: no limits → global cap (non-admin usage only)
-- → unlimited user: no per-user limit → per-user override → role default (guest_per_day / per_user_per_day).
create or replace function public.consume_ai_quota(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_today date := (now() at time zone 'Asia/Jakarta')::date;
  v_limits jsonb;
  v_role text;
  v_lim public.user_limits;
  v_limit int;
  v_used int;
begin
  perform pg_advisory_xact_lock(hashtext('ai_usage'));
  select value into v_limits from public.app_settings where key = 'limits';
  if not coalesce((v_limits->>'ai_enabled')::boolean, true) then raise exception 'AI_DISABLED'; end if;

  select role into v_role from public.profiles where id = p_user_id;
  if v_role is distinct from 'admin' then
    -- Admin calls do not eat into the shared daily cap.
    select coalesce(sum(u.calls), 0) into v_used
      from public.ai_usage u join public.profiles p on p.id = u.user_id
      where u.day = v_today and p.role <> 'admin';
    if (v_limits->>'global_per_day') is not null and v_used + 1 > (v_limits->>'global_per_day')::int then
      raise exception 'GLOBAL_LIMIT';
    end if;

    select * into v_lim from public.user_limits where user_id = p_user_id;
    if not coalesce(v_lim.unlimited, false) then
      v_limit := coalesce(v_lim.ai_calls_per_day, (v_limits->>(case when v_role = 'guest' then 'guest_per_day' else 'per_user_per_day' end))::int);
      select coalesce(calls, 0) into v_used from public.ai_usage where user_id = p_user_id and day = v_today;
      if v_limit is not null and coalesce(v_used, 0) + 1 > v_limit then
        raise exception '%', case when v_role = 'guest' then 'GUEST_LIMIT' else 'USER_LIMIT' end;
      end if;
    end if;
  end if;

  insert into public.ai_usage as u (user_id, day, calls) values (p_user_id, v_today, 1)
  on conflict (user_id, day) do update set calls = u.calls + 1;
end $$;

revoke execute on function public.consume_ai_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_quota(uuid) to service_role;
