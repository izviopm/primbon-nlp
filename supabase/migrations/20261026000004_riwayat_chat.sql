-- Riwayat chat per akun dan gambar di chat (PRD 8, 9). Akun tamu dipakai bersama, jadi tidak menyimpan riwayat.

create table public.percakapan (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  judul text not null check (length(trim(judul)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index percakapan_user_idx on public.percakapan (user_id, updated_at desc);

create table public.pesan (
  id bigint generated always as identity primary key,
  percakapan_id uuid not null references public.percakapan on delete cascade,
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  peran text not null check (peran in ('user', 'mbah')),
  teks text,              -- pesan user
  gambar_path text,       -- object di bucket "chat-gambar": <user id>/<percakapan id>/<file>
  balasan jsonb,          -- balasan Mbah (bentuk Balasan di src/lib/balasan.ts)
  created_at timestamptz not null default now()
);
create index pesan_percakapan_idx on public.pesan (percakapan_id, id);

alter table public.percakapan enable row level security;
alter table public.pesan enable row level security;

create policy "own" on public.percakapan for all to authenticated
  using (user_id = (select auth.uid()) and not (select public.is_guest()))
  with check (user_id = (select auth.uid()) and not (select public.is_guest()));

create policy "own read" on public.pesan for select to authenticated
  using (user_id = (select auth.uid()));
create policy "own insert" on public.pesan for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.percakapan c where c.id = percakapan_id and c.user_id = (select auth.uid()))
  );

-- Every new message bumps its conversation to the top of the list.
create function public.sentuh_percakapan() returns trigger
language plpgsql set search_path = '' as $$
begin
  update public.percakapan set updated_at = now() where id = new.percakapan_id;
  return new;
end $$;
create trigger pesan_sentuh_percakapan after insert on public.pesan
  for each row execute function public.sentuh_percakapan();
revoke execute on function public.sentuh_percakapan() from public, anon, authenticated;

-- Private bucket: images are only reachable through short-lived signed URLs for their owner.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chat-gambar', 'chat-gambar', false, 3145728, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "chat-gambar insert own folder" on storage.objects for insert to authenticated
  with check (bucket_id = 'chat-gambar' and (storage.foldername(name))[1] = (select auth.uid())::text and not (select public.is_guest()));
create policy "chat-gambar read own folder" on storage.objects for select to authenticated
  using (bucket_id = 'chat-gambar' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "chat-gambar delete own folder" on storage.objects for delete to authenticated
  using (bucket_id = 'chat-gambar' and (storage.foldername(name))[1] = (select auth.uid())::text);
