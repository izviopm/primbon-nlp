-- Rincian primbon (PRD 5.5): watak hari, watak pasaran, dan wuku. Isi data ada di migration berikutnya.

alter table public.hari add column watak text, add column sumber_watak text;
alter table public.pasaran add column watak text, add column sumber_watak text;

create table public.wuku (
  urutan int primary key check (urutan between 0 and 29), -- 0 = Sinta
  nama text not null unique,
  dewa text not null,
  watak text not null,
  sumber text not null
);
alter table public.wuku enable row level security;
create policy "read" on public.wuku for select to authenticated using (true);

-- Wuku dari tanggal: siklus 210 hari (30 wuku × 7 hari), Sinta dimulai Minggu Pahing 17 Desember 2000.
create function public.wuku_dari(p_tanggal date)
returns table (urutan int, nama text, dewa text, watak text, sumber text)
language sql stable set search_path = '' as $$
  select w.urutan, w.nama, w.dewa, w.watak, w.sumber
  from public.wuku w
  where p_tanggal is not null
    and w.urutan = mod(mod(p_tanggal - date '2000-12-17', 210) + 210, 210) / 7;
$$;

-- Satu "kartu weton" lengkap. Dipakai tipe WETON (dari tanggal) dan WATAK (dari weton atau tanggal);
-- kolom wuku NULL jika yang diketahui hanya weton, karena wuku butuh tanggal.
create function public.primbon_profil(p_hari text, p_pasaran text, p_tanggal date)
returns table (hari text, pasaran text, neptu_hari int, neptu_pasaran int, neptu int,
               watak_hari text, watak_pasaran text, watak_weton text,
               wuku text, wuku_ke int, dewa_wuku text, watak_wuku text,
               sumber_hari_pasaran text, sumber_weton text, sumber_wuku text)
language sql stable set search_path = '' as $$
  select w.hari, w.pasaran, w.neptu_hari, w.neptu_pasaran, w.neptu,
         h.watak, p.watak, k.deskripsi,
         u.nama, u.urutan + 1, u.dewa, u.watak,
         h.sumber_watak, k.sumber, u.sumber
  from public.weton_dari(p_hari, p_pasaran, p_tanggal) w
  join public.hari h on h.nama = w.hari
  join public.pasaran p on p.nama = w.pasaran
  join public.watak k on k.hari = w.hari and k.pasaran = w.pasaran
  left join public.wuku_dari(p_tanggal) u on true;
$$;

revoke execute on function public.wuku_dari(date) from public, anon;
revoke execute on function public.primbon_profil(text, text, date) from public, anon;
grant execute on function public.wuku_dari(date) to authenticated;
grant execute on function public.primbon_profil(text, text, date) to authenticated;
