# UI Rules: Primbon NLP

Aturan ini wajib diikuti untuk setiap komponen dan halaman. Untuk urusan visual, dokumen ini menang jika bertentangan dengan dokumen lain. Disusun dengan skill ui-ux-pro-max (palet hangat "Bakery/Cafe" dan "Diary" yang disesuaikan ke warna batik sogan, aturan UX untuk aksesibilitas, sentuhan, dan animasi).

## 1. Prinsip

- **Hangat dan terang.** Hanya tema terang. Tidak ada mode gelap, tidak mengikuti `prefers-color-scheme`, dan tidak ada latar gelap besar. Primbon harus terasa seperti bertanya ke simbah yang ramah, bukan dunia mistis.
- **Unsur Jawa yang halus.** Batik, gunungan, dan aksara hadir sebagai aksen, bukan dekorasi yang memenuhi layar.
- **Prosesnya terlihat.** Panel tahapan (Scanner, Parser, Translator, Evaluator) adalah bagian utama produk, bukan fitur tersembunyi.
- **Aksesibel secara default.** Kontras, fokus, dan target sentuh di bawah ini wajib.

## 2. Bahasa antarmuka

- Semua teks UI berbahasa Indonesia, `<html lang="id">`.
- Aksara Jawa hanya sebagai ornamen: selalu `aria-hidden="true"`, `lang="jv-Java"`, dan didampingi teks Latin.

## 3. Teknologi

- **Tailwind CSS 4**. Token di `@theme` (`src/app/globals.css`), dipakai lewat kelas (`bg-primary`, `text-muted-foreground`). Tidak ada hex mentah di komponen, kecuali SVG ornamen yang memakai `currentColor`.
- **motion** (`motion/react`) untuk animasi. `MotionConfig reducedMotion="user"` membungkus aplikasi.
- **Animate UI** (`@animate-ui/react/primitives/radix-ui/*`) untuk primitive yang beranimasi: Accordion (panel tahapan), Drawer (panel tahapan di mobile), Tabs (admin).
- Ikon: **Lucide** saja. Tidak ada emoji sebagai ikon.

## 4. Tipografi

| Peran | Font | Bobot |
|---|---|---|
| Judul | **Fraunces** (serif hangat, terasa klasik) | 600, 700 |
| Isi dan UI | **Plus Jakarta Sans** (dirancang di Jakarta) | 400, 500, 600, 700 |
| Ornamen aksara | **Noto Sans Javanese** | 400 |
| Kode (SQL, token) | `ui-monospace` | 400 |

- Semua lewat `next/font/google`.
- Isi minimal `text-base` (16 px) dengan tinggi baris 1.5. Tidak ada teks isi di bawah 12 px.
- Judul memakai `text-balance`.

## 5. Warna

| Token | Hex | Pemakaian | Kontras |
|---|---|---|---|
| `background` | `#FBF6EC` | Latar krem | |
| `card` | `#FFFDF8` | Kartu, balon chat | |
| `foreground` | `#3B2414` | Teks utama | 13.5:1 di background |
| `muted` | `#F3EBDD` | Latar sekunder | |
| `muted-foreground` | `#6B5444` | Teks sekunder | 6.5:1 di background |
| `border` | `#E7D9C3` | Garis | |
| `primary` | `#7C3A12` | Sogan: tombol utama, tautan, fokus | 7.9:1; teks putih 8.5:1 |
| `primary-strong` | `#5B2A0C` | Hover tombol utama | |
| `primary-soft` | `#F3E2D3` | Latar badge sogan | |
| `gold` | `#E3B04B` | Aksen emas: ornamen, highlight. Teks di atasnya wajib `foreground` | 7.3:1 |
| `gold-soft` | `#F6E7C1` | Latar lembut emas | |
| `gold-text` | `#8A5A0B` | Teks emas di latar terang | 5.5:1 |
| `nila` | `#1F4E5F` | Nila (biru batik): **penanda AI** | 8.4:1; teks putih 9.1:1 |
| `nila-soft` | `#E1EEF1` | Latar label AI | |
| `success` | `#166534` | Berhasil | 6.6:1 |
| `destructive` | `#B91C1C` | Error | 6.0:1 |

### Penanda sumber jawaban

- **Rule-based**: ikon `Cog`, warna sogan (`primary`).
- **AI**: ikon `Sparkles`, warna nila (`nila`). Bukan ungu/pink, supaya tetap senada dengan batik.
- Label selalu berupa ikon **dan** teks, tidak hanya warna.

### Kelas token (tahap Scanner)

| Kelas | Warna latar |
|---|---|
| KATA_TANYA | `primary-soft` |
| HARI, PASARAN | `gold-soft` |
| BULAN, ANGKA | `nila-soft` |
| KATA_KUNCI, PENGHUBUNG | `muted` |
| TIDAK_DIKENAL | garis putus-putus `destructive` |

## 6. Unsur Jawa

- **Kawung** (`pattern-kawung`): hanya di header dan hero, opasitas maksimal 7%, warna `currentColor`.
- **Gunungan**: logo dan animasi "Mbah sedang berpikir" (bergoyang pelan). Saat reduced motion, gunungan diam.
- **Aksara Jawa**: ꦥꦿꦶꦩ꧀ꦧꦺꦴꦤ꧀ ("primbon") di logo dan hero.
- **Garis tepi batik**: garis emas tipis (`border-gold`) di kartu jawaban primbon.

## 7. Layout

- Mobile-first. Breakpoint: `sm` 640, `md` 768, `lg` 1024.
- Tanpa scroll horizontal di lebar 360 px. Blok kode (SQL) boleh scroll horizontal di dalam kotaknya sendiri.
- **Chat**: tinggi `100dvh` dikurangi header. Input menempel di bawah dengan `pb-[env(safe-area-inset-bottom)]`.
- **Panel tahapan**: `lg` ke atas tampil di kolom kanan (sticky). Di bawah `lg`, tombol "Lihat tahapan" pada balon jawaban membuka Drawer dari bawah.
- Lebar konten maksimal `max-w-6xl`. Teks penjelasan maksimal sekitar 70 karakter per baris.

## 8. Interaksi dan animasi

- Target sentuh minimal 44 × 44 px (`min-h-11`), jarak antar target minimal 8 px.
- Durasi: 150-250 ms untuk mikrointeraksi, maksimal 400 ms untuk masuknya elemen. Keluar lebih cepat daripada masuk.
- Hanya animasikan `transform` dan `opacity`.
- Balon chat masuk dengan fade + naik 8 px. Tahapan di panel muncul berurutan (stagger 60 ms).
- Tombol: `cursor-pointer`, `active:scale-97`, fokus `ring-2 ring-ring ring-offset-2`.
- Saat menunggu jawaban: gunungan bergoyang + teks "Mbah sedang menghitung…" (`aria-live="polite"`).

## 9. Form

- Label selalu terlihat, tidak memakai placeholder sebagai label.
- Error di bawah field (`aria-invalid`, `aria-describedby`), fokus pindah ke field error pertama.
- Password punya tombol tampilkan/sembunyikan.

## 10. Checklist sebelum selesai

- [ ] Tidak ada emoji sebagai ikon.
- [ ] Kontras teks minimal 4.5:1.
- [ ] Fokus keyboard terlihat di semua kontrol.
- [ ] `prefers-reduced-motion` dihormati.
- [ ] Dicek di 360, 768, 1024, dan 1440 px.
- [ ] Hanya tema terang.
