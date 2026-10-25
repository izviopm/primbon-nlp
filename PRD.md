# PRD: Primbon NLP

Dokumen ini adalah sumber kebenaran untuk perilaku produk. Jika ada yang bertentangan dengan dokumen lain, ikuti PRD ini.

## 1. Latar belakang dan tujuan

Tugas mata kuliah Kecerdasan Artifisial (Universitas Budi Luhur): **Mesin Penterjemah Rule-Based** bertema kearifan lokal. Rujukan utama adalah makalah dosen, *Aplikasi Pengolah Bahasa Alami untuk Info Gempa Bumi Terkini dengan Sumber Data pada Twitter @InfoBMKG* (Indra & Sri Hartati, SNATI 2014). Makalah itu menerjemahkan pertanyaan bahasa Indonesia menjadi query database lewat empat tahap: **Scanner, Parser, Translator, Evaluator**.

Primbon NLP memakai pola yang sama untuk **weton dan primbon Jawa**. User bertanya dalam bahasa Indonesia, misalnya "Apakah weton Senin Legi cocok dengan Jumat Kliwon?", lalu mesin rule-based menerjemahkannya menjadi query SQL dan menghitung jawabannya.

Tujuan:

1. Memenuhi kelima butir tugas (lihat bagian 3) dengan implementasi yang bisa didemokan.
2. Menunjukkan setiap tahap (Scanner, Parser, Translator, Evaluator) secara visual di UI, supaya mudah dijelaskan di presentasi.
3. Mengatasi kelemahan rule-based (kalimat harus kaku) dengan AI, **tanpa** mengambil alih tugas rule-based (lihat bagian 6).
4. Seru dan mudah dicoba teman sekelas di HP maupun laptop.

## 2. Prinsip utama: AI menerjemahkan, rule-based menjawab

Ini aturan terpenting di produk ini dan harus bisa dijelaskan di presentasi dalam satu kalimat:

> **AI hanya membantu mengubah kalimat bebas menjadi kalimat baku yang dimengerti mesin rule-based. Semua jawaban primbon (weton, neptu, jodoh, tanggal, watak) selalu dihitung oleh mesin rule-based.**

Konsekuensinya:

- AI tidak pernah menghitung weton, neptu, atau kecocokan. Jika AI menyebut angka, angka itu diabaikan.
- Kalimat hasil AI **wajib lolos Scanner dan Parser** yang sama. Jika tidak lolos, kalimat ditolak. AI tidak bisa "menyelundupkan" jawaban.
- Setiap jawaban di UI diberi label sumbernya (bagian 6.4), sehingga dosen bisa melihat mana kerja rule-based dan mana kerja AI.

## 3. Pemetaan ke butir tugas

| Butir tugas | Di produk ini |
|---|---|
| 1. Tema kearifan lokal | Weton dan primbon Jawa: hari pasaran, neptu, kecocokan jodoh, watak |
| 2. 3-5 tipe kalimat pertanyaan | 5 tipe: WETON, NEPTU, JODOH, KAPAN, WATAK (bagian 4) |
| 3. Aturan produksi | Grammar BNF di bagian 5.3, diimplementasikan sebagai parser |
| 4. Scanner, Parser, Translator, Evaluator | `src/lib/nlp/` (bagian 5), dan setiap tahap ditampilkan di panel UI |
| 5. Dokumen PPTX/DOCX + implementasi | `CARA_KERJA.md` (bahan presentasi), README, panel tahapan (bisa di-screenshot), dan kode sumber |

## 4. Tipe kalimat

| Kode | Kata tanya | Contoh kalimat baku | Jawaban |
|---|---|---|---|
| `WETON` | Apa | apa weton orang yang lahir tanggal 17 agustus 2003 | Minggu Kliwon |
| `NEPTU` | Berapa | berapa neptu weton senin legi | 4 + 5 = 9 |
| `JODOH` | Apakah | apakah weton senin legi cocok dengan jumat kliwon | 9 + 14 = 23, 23 mod 9 = 5, Tinari |
| `KAPAN` | Kapan | kapan jumat kliwon berikutnya / kapan jumat kliwon di bulan desember 2026 | Daftar tanggal |
| `WATAK` | Bagaimana | bagaimana watak orang dengan weton rabu pon | Watak weton Rabu Pon |

Variasi yang tetap dikenali rule-based (tanpa AI):

- `NEPTU` dan `WATAK` boleh memakai tanggal lahir sebagai pengganti weton: "berapa neptu orang yang lahir tanggal 1 januari 2004".
- `JODOH` boleh memakai tanggal di salah satu atau kedua sisi: "apakah weton tanggal 17 agustus 2003 cocok dengan weton tanggal 1 januari 2004".
- Kata opsional (`orang yang`, `pada`, `weton`, `di`) boleh ada atau tidak.

## 5. Mesin rule-based

Semua tahap adalah fungsi TypeScript murni di `src/lib/nlp/` (kecuali Evaluator yang membaca database), dan masing-masing punya unit test.

### 5.1 Preprocessing (bagian dari Scanner)

Sama seperti makalah dosen, ditambah normalisasi berbasis kamus:

1. Ubah ke huruf kecil.
2. Hapus tanda baca (`. , ; ? ! / '`) dan ganti dengan spasi, **kecuali** di dalam format tanggal angka.
3. Normalisasi tanggal angka: `17/8/2003`, `17-08-2003`, `17.08.2003` menjadi `17 agustus 2003`.
4. Kamus sinonim (rule-based, bisa diperluas):
   - Hari: `jum'at`, `jumat` → `jumat`; `ahad` → `minggu`.
   - Pasaran: `manis` → `legi`; `kaliwon` → `kliwon`; `paing` → `pahing`.
   - Bulan: `jan`, `feb`, `mar`, `apr`, `jun`, `jul`, `agt`, `agu`, `ags`, `sep`, `okt`, `nov`, `des`, serta `nopember`, `pebruari`.
   - Kata tanya informal: `gimana` → `bagaimana`; `brp` → `berapa`; `apakah`, `apa kah` → `apakah`.
5. Batas input: 1-300 karakter. Input kosong atau terlalu panjang ditolak sebelum Scanner.

Makalah dosen menolak input dengan 5 token atau kurang. Di sini aturan itu **tidak dipakai**, karena "neptu senin legi" (3 token) sudah jelas maksudnya. Kalimat pendek tetap diproses Parser, dan jika tidak cocok akan masuk ke jalur AI (bagian 6).

### 5.2 Scanner

Memecah kalimat menjadi token dan memberi label kelas kata:

| Kelas | Isi |
|---|---|
| `KATA_TANYA` | apa, berapa, apakah, kapan, bagaimana |
| `KATA_KUNCI` | weton, neptu, cocok, watak, lahir, tanggal, berikutnya, bulan |
| `HARI` | senin, selasa, rabu, kamis, jumat, sabtu, minggu |
| `PASARAN` | legi, pahing, pon, wage, kliwon |
| `BULAN` | januari ... desember |
| `ANGKA` | bilangan bulat |
| `PENGHUBUNG` | orang, yang, pada, di, dengan |
| `TIDAK_DIKENAL` | token lain |

Keluaran: daftar `{ teks, kelas, posisi }`. Token `TIDAK_DIKENAL` tidak langsung menggagalkan Scanner. Parser yang memutuskan.

### 5.3 Parser dan aturan produksi

Parser *recursive descent* yang mengikuti grammar di bawah. `[x]` berarti opsional, `|` berarti pilihan. Setiap aturan punya nomor yang ditampilkan di panel UI.

```text
R1   <S>          → <Q_Weton> | <Q_Neptu> | <Q_Jodoh> | <Q_Kapan> | <Q_Watak>
R2   <Q_Weton>    → apa weton [orang yang] [lahir] [pada] tanggal <Tanggal>
R3   <Q_Neptu>    → berapa neptu <Subjek>
R4   <Q_Jodoh>    → apakah <Subjek> cocok dengan <Subjek>
R5   <Q_Kapan>    → kapan [weton] <Weton> <Waktu>
R6   <Q_Watak>    → bagaimana watak [orang dengan] <Subjek>
R7   <Subjek>     → [weton] <Weton> | [weton] [orang yang] [lahir] [pada] tanggal <Tanggal>
R8   <Waktu>      → berikutnya | [di] bulan <Bulan> <Tahun>
R9   <Weton>      → <Hari> <Pasaran>
R10  <Hari>       → senin | selasa | rabu | kamis | jumat | sabtu | minggu
R11  <Pasaran>    → legi | pahing | pon | wage | kliwon
R12  <Tanggal>    → <Angka> <Bulan> <Tahun>
R13  <Bulan>      → januari | februari | maret | april | mei | juni | juli
                  | agustus | september | oktober | november | desember
R14  <Tahun>      → <Angka>   (1900-2100)
```

Keluaran: pohon parse, nomor aturan yang dipakai, dan nilai yang diekstrak (misalnya `{ jenis: "JODOH", kiri: {hari:"senin", pasaran:"legi"}, kanan: {...} }`).

Dua jenis kegagalan dibedakan:

- **Gagal sintaks**: kalimat tidak cocok dengan grammar. Ini yang boleh diteruskan ke AI (bagian 6).
- **Gagal semantik**: kalimat cocok tetapi nilainya salah, misalnya "30 februari 2003" atau tahun 1850. **Tidak** diteruskan ke AI. User langsung diberi pesan yang jelas, misalnya "Tanggal 30 Februari 2003 tidak ada".

### 5.4 Translator

Mengubah hasil parse menjadi **rencana query** (`QueryPlan`) dan **teks SQL** yang ditampilkan di UI. Keduanya dibuat dari template yang sama.

Contoh untuk `JODOH`:

```sql
-- R4: apakah <Subjek> cocok dengan <Subjek>
SELECT (h1.neptu + p1.neptu) AS neptu_1,
       (h2.neptu + p2.neptu) AS neptu_2,
       j.nama, j.arti
FROM hari h1, pasaran p1, hari h2, pasaran p2, jodoh j
WHERE h1.nama = $1 AND p1.nama = $2
  AND h2.nama = $3 AND p2.nama = $4
  AND j.sisa = (h1.neptu + p1.neptu + h2.neptu + p2.neptu) % 9;
-- $1='senin' $2='legi' $3='jumat' $4='kliwon'
```

Aturan keamanan: SQL **tidak pernah** dibuat dengan menggabungkan string dari input user. Nilai selalu menjadi parameter (`$1`, `$2`, ...). Database hanya mengeksekusi fungsi SQL tetap (RPC, bagian 8) dengan isi yang sama persis dengan template yang ditampilkan. Tidak ada fungsi "jalankan SQL bebas".

Jika subjek berupa tanggal, Translator mencatat langkah konversi tanggal ke weton (bagian 5.5) sebelum query.

### 5.5 Evaluator

Menjalankan rencana query dan menyusun jawaban. Setiap langkah dicatat untuk panel UI.

**Perhitungan tanggal ke weton** (di TypeScript, karena ini aritmetika, bukan data):

- Hari: dari kalender Masehi biasa.
- Pasaran: tanggal acuan **17 Agustus 1945 = Jumat Legi**. `pasaran = urutan[(selisih_hari mod 5 + 5) mod 5]` dengan urutan `[Legi, Pahing, Pon, Wage, Kliwon]`. Rumus `+ 5` menjaga hasil tetap positif untuk tanggal sebelum 1945.
- Semua tanggal dihitung dalam zona **Asia/Jakarta**, termasuk "hari ini" untuk `KAPAN ... berikutnya`.

**Neptu** (dari tabel `hari` dan `pasaran`):

| Hari | Neptu | Pasaran | Neptu |
|---|---|---|---|
| Minggu | 5 | Legi | 5 |
| Senin | 4 | Pahing | 9 |
| Selasa | 3 | Pon | 7 |
| Rabu | 7 | Wage | 4 |
| Kamis | 8 | Kliwon | 8 |
| Jumat | 6 | | |
| Sabtu | 9 | | |

**Jodoh**: jumlahkan neptu kedua weton, lalu `jumlah mod 9`, dibaca dari tabel `jodoh`. Rumus ini cocok dengan daftar angka di Bisnis.com (misalnya Pegat = 1, 9, 10, 18, 19, 27, 28, 36 dan Pesthi = 8, 17, 26, 35):

| Sisa (mod 9) | Jumlah neptu | Nama | Arti |
|---|---|---|---|
| 0, 1 | 9, 10, 18, 19, 27, 28, 36 | Pegat | Rumah tangga kemungkinan menghadapi banyak masalah, misalnya beda pendapat atau konflik. Dianggap pengingat untuk menjaga komunikasi |
| 2 | 11, 20, 29 | Ratu | Pasangan yang dihormati dan disegani lingkungan, dianggap cocok membangun hidup bersama |
| 3 | 12, 21, 30 | Jodoh | Hasil yang paling diharapkan: cocok dan saling melengkapi |
| 4 | 13, 22, 31 | Topo | Rumah tangga perlu perjuangan lebih besar di awal sebelum mencapai kestabilan |
| 5 | 14, 23, 32 | Tinari | Membawa keberuntungan, rezeki, dan kemudahan |
| 6 | 15, 24, 33 | Padu | Kemungkinan sering berbeda pendapat atau bertengkar, pengingat untuk saling memahami |
| 7 | 16, 25, 34 | Sujanan | Ujian dalam hubungan, seperti rasa curiga atau gangguan dari pihak luar |
| 8 | 17, 26, 35 | Pesthi | Rumah tangga tenteram, harmonis, dan damai |

Rentang jumlah neptu dua orang adalah 14 (Selasa Wage + Selasa Wage) sampai 36 (Sabtu Pahing + Sabtu Pahing).

Sumber: rentang angka dari [Bisnis.com](https://kabar24.bisnis.com/read/20241106/243/1813354/cara-hitung-weton-jawa-untuk-pernikahan-agar-jauh-dari-bala), arti kategori dan tabel neptu dari [Pegadaian](https://pegadaian.co.id/artikel/inspirasi/hitungan-weton-jawa-untuk-pernikahan). Sumber lain bisa berbeda (misalnya Detik memberi rentang Ratu yang lain), sehingga kolom `sumber` di tabel `jodoh` wajib diisi.

**KAPAN**:

- `berikutnya`: tanggal pertama mulai **hari ini** (termasuk hari ini) yang wetonnya sama. Jika hari ini, jawab "Hari ini!".
- `bulan <Bulan> <Tahun>`: semua tanggal di bulan itu yang wetonnya sama. Karena siklus weton 35 hari, hasilnya 0 atau 1 tanggal. Jika 0, jawab dengan tanggal terdekat sebelum dan sesudah bulan itu.

**WATAK**: watak untuk weton itu (35 baris, satu per weton) dari tabel `watak`, beserta sumbernya: parafrasa [detikJateng](https://www.detik.com/jateng/budaya/d-8160116/35-weton-hari-lahir-dan-kepribadiannya-berdasarkan-primbon-jawa) (14 Okt 2025) yang merujuk *Primbon Praktis* (Mama Flo).

Format jawaban selalu menyertakan **cara hitungnya** dalam satu baris, misalnya "Senin Legi (9) + Jumat Kliwon (14) = 23 → 23 mod 9 = 5 → **Tinari**".

**Disclaimer** kecil di setiap jawaban jodoh dan watak: "Primbon adalah warisan budaya, bukan ramalan pasti."

## 6. Peran AI

AI dipakai di dua tempat, dan setiap panggilan dihitung ke kuota harian (bagian 7). Provider: **OpenAI-compatible** (Base URL + API key + model), diatur admin.

### 6.1 Normalizer: kalimat bebas → kalimat baku

Dipanggil **hanya jika Parser gagal sintaks**. Jika rule-based berhasil, AI tidak dipanggil sama sekali, sehingga hemat biaya dan cepat.

Masukan ke AI:

- Kalimat asli user.
- Lima template kalimat baku (bagian 4) dan daftar kosakata yang dikenali Scanner.
- Tanggal hari ini (Asia/Jakarta), supaya "besok" atau "jumat depan" bisa diubah menjadi tanggal.
- Kalimat baku terakhir di percakapan (jika ada), supaya pertanyaan lanjutan seperti "kalau sama rabu pon?" bisa dipahami.

Keluaran AI wajib JSON:

```json
{ "jenis": "primbon", "kalimat": "apakah weton senin legi cocok dengan rabu pon" }
{ "jenis": "tentang_project" }
{ "jenis": "di_luar_topik" }
```

Alur:

1. `primbon` → `kalimat` dimasukkan lagi ke Scanner dan Parser. Jika lolos, lanjut ke Translator dan Evaluator seperti biasa. Jika tidak lolos, user mendapat pesan "Mbah belum paham" beserta contoh kalimat. **Hanya satu kali percobaan AI per pertanyaan.**
2. `tentang_project` → diteruskan ke Tanya Mbah (6.2).
3. `di_luar_topik` → jawaban sopan bahwa Primbon NLP hanya membahas weton dan primbon, beserta contoh pertanyaan.
4. JSON rusak atau AI tidak bisa dihubungi → diperlakukan sebagai gagal, user mendapat contoh kalimat. Tidak ada error teknis yang ditampilkan ke user.

Contoh yang harus berhasil lewat Normalizer:

| Kalimat asli | Kalimat baku |
|---|---|
| aku lahir 17an agustus 2003, wetonku apa ya? | apa weton orang yang lahir tanggal 17 agustus 2003 |
| aku senin legi, pacarku jumat kliwon, cocok ga? | apakah weton senin legi cocok dengan jumat kliwon |
| jumat kliwon terdekat kapan sih | kapan jumat kliwon berikutnya |
| kalo yg lahir besok neptunya brp | berapa neptu orang yang lahir tanggal 26 oktober 2026 (contoh, sesuai tanggal hari ini) |

### 6.2 Tanya Mbah: pertanyaan tentang project

Untuk pertanyaan seperti "Apa itu parser?", "Kenapa jodoh pakai mod 9?", atau "Project ini cara kerjanya gimana?".

- System prompt berisi ringkasan dokumen ini: tujuan, empat tahap, aturan produksi, tabel data, dan peran AI.
- Persona: "Mbah", ramah dan sedikit jenaka, menjawab dalam bahasa Indonesia.
- Tidak boleh menghitung weton. Jika ditanya hitungan, Mbah mengarahkan user untuk bertanya langsung, misalnya "Coba tanya: *apa weton orang yang lahir tanggal ...*".
- Jika kuota AI habis, user mendapat pesan yang jelas, dan pertanyaan dengan kalimat baku tetap bisa dijawab rule-based.
- Riwayat percakapan yang dikirim maksimal 10 pesan terakhir.

### 6.3 Model utama dan cadangan

- Admin mengatur satu **model utama** dan daftar **model cadangan** berurutan.
- Jika model utama gagal (down, timeout, rate limit, model tidak ditemukan, balasan kosong), model berikutnya dicoba sesuai urutan.
- Error API key (401/403) dan limit kuota **tidak** memicu fallback, karena semua model memakai key yang sama.
- Timeout per panggilan: 30 detik.
- Tidak ada verifikasi multi-model seperti Goukaku. Satu jawaban dari model yang berhasil sudah cukup, karena kebenaran jawaban primbon dijamin oleh rule-based.

### 6.4 Label sumber jawaban

Setiap balon jawaban memiliki label:

| Label | Arti |
|---|---|
| ⚙️ **Rule-based** | Kalimat langsung dikenali Parser |
| ⚙️ **Rule-based** · 🤖 *kalimat dirapikan AI* | AI menulis ulang kalimat, rule-based yang menjawab. Kalimat asli dan kalimat baku ditampilkan |
| 🤖 **Mbah AI** | Jawaban dari Tanya Mbah, bukan hasil hitungan primbon |

## 7. Pengguna dan peran

**Semua halaman wajib login.** Tanpa sesi, user diarahkan ke `/login`.

| Peran | Bisa |
|---|---|
| `guest` (akun Tamu) | Chat Primbon lengkap (rule-based, Normalizer AI, Tanya Mbah) dengan **kuota AI kecil**. My profile hanya bisa dilihat, tidak bisa diubah |
| `user` | Chat Primbon dengan kuota AI normal. Bisa mengubah **My profile** dan password |
| `admin` | Semua di atas dengan AI **unlimited** (tidak terkena limit per user maupun batas global), ditambah mendaftarkan dan mengelola user, mengatur AI (Base URL, API key, model utama dan cadangan), mengatur limit, dan melihat statistik |

- Tidak ada pendaftaran mandiri. Akun dibuat admin, seperti Goukaku.
- **My profile** (`/akun`): nama, jenis kelamin, email (hanya baca), foto profil (PNG/JPG/WebP maks 2 MB, atau avatar default sesuai jenis kelamin), dan ganti password.

### Akun Tamu

Untuk dosen dan teman sekelas yang ingin mencoba saat presentasi tanpa dibuatkan akun.

- Login dengan username **`tamu`** dan password **`tamu`**, atau tombol **Masuk sebagai Tamu** di halaman login.
- Supabase Auth mewajibkan password minimal 6 karakter dan email, jadi "tamu/tamu" adalah **alias**: server menukarnya dengan email dan password asli akun tamu dari environment variable (`GUEST_EMAIL`, `GUEST_PASSWORD`). Password asli tidak pernah dikirim ke browser.
- Akun tamu dibuat sekali oleh skrip setup (`npm run setup:guest`) dengan `role = 'guest'`.
- Semua pengunjung tamu **berbagi satu akun**, sehingga kuota tamu adalah kuota bersama, bukan per orang. Default 30 panggilan AI per hari untuk seluruh tamu, bisa diubah admin.
- Tamu tidak bisa mengubah nama, foto, atau password, karena akun ini dipakai bersama. Server menolak perubahan itu walaupun form dikirim manual.
- Jika kuota tamu habis: pesan "Kuota AI tamu hari ini sudah habis. Coba pakai kalimat baku, Mbah tetap bisa jawab!" beserta chip contoh kalimat.

## 8. Halaman

| Route | Isi |
|---|---|
| `/` | Chat Primbon: hero singkat, chip contoh untuk 5 tipe kalimat, area chat, dan panel tahapan |
| `/login` | **Panduan langkah demi langkah** "Cara Mbah menjawab": satu kalimat contoh melewati Pertanyaan → (Normalizer AI) → Scanner → Parser → Translator → Evaluator → Jawaban, maju otomatis tiap 5 detik (garis progres, tombol Jeda/Putar, berhenti saat user menavigasi sendiri, hanya saat terlihat di layar, tidak jalan saat reduced motion), dengan tombol Sebelumnya/Berikutnya, titik langkah yang bisa diklik, tombol panah keyboard, dan pilihan contoh kalimat baku atau kalimat bebas (AI); isinya output asli mesin. Di mobile ada tautan "Langsung masuk", lalu login email (atau username `tamu`) dan password, plus tombol **Masuk sebagai Tamu** |
| `/akun` | My profile |
| `/admin` | Tab: Users, AI settings, Limits, Statistik |

### Panel tahapan

Setiap jawaban primbon memiliki panel yang bisa dibuka, berisi empat bagian berurutan (ditambah bagian Normalizer jika AI terlibat):

0. **Normalizer AI** (jika ada): kalimat asli → kalimat baku, dan nama model yang dipakai.
1. **Scanner**: hasil preprocessing dan token berwarna sesuai kelas.
2. **Parser**: pohon parse dan nomor aturan yang dipakai (misalnya R1 → R4 → R7 → R9).
3. **Translator**: teks SQL beserta parameternya.
4. **Evaluator**: langkah perhitungan dan hasil akhir.

Chat selalu satu kolom bersih di tengah. Panel dibuka lewat tombol "Lihat tahapan" pada jawaban: di desktop (≥ 1024 px) sebagai **sidebar kanan** (chat bergeser memberi ruang, tutup dengan X atau Esc), di mobile sebagai *bottom sheet*. Header panel menyebut pertanyaan yang sedang dibedah.

**Petunjuk (coachmark)**: setelah jawaban rule-based, balon petunjuk muncul di bawahnya dan menyorot tombol "Lihat tahapan". Maksimal 3 kali per browser, dan berhenti selamanya begitu user membuka tahapan atau memilih "Sudah paham, jangan tampilkan lagi" (disimpan di `localStorage`).

### Admin

- **Users**: buat akun (nama, jenis kelamin, email, password), reset password, ubah peran. Diambil dari Goukaku.
- **AI settings**: Base URL, API key (hanya bisa ditimpa, tidak pernah ditampilkan, cukup indikator "tersimpan"), model utama, model cadangan (urutan bisa diubah), tombol **Ambil daftar model** (`GET {baseUrl}/models`), dan tombol **Tes koneksi**.
- **Limits**: default panggilan AI per user per hari, default akun tamu per hari (bersama), batas global per hari, dan kill switch AI.
- **Limit per pengguna** (tab Pengguna): admin bisa memberi limit khusus (angka per hari) atau **Unlimited** ke user mana pun, termasuk akun tamu. Dikosongkan berarti kembali ke default. Setiap pengguna menampilkan pemakaian hari ini dan limit efektifnya.
- **Statistik**: jumlah pertanyaan per hari, dibagi menurut sumber (rule-based langsung, dibantu AI, Tanya Mbah, gagal), serta 20 kalimat gagal terakhir. Data ini berguna untuk memperluas kamus sinonim dan untuk slide presentasi ("X% dijawab rule-based tanpa AI").

## 9. Skema data (Supabase)

```text
profiles        id (auth.users), role ('admin' | 'user' | 'guest'), full_name,
                gender ('male' | 'female' | null), avatar_path, created_at
                -- user hanya bisa mengubah full_name, gender, avatar_path miliknya
                -- foto di Storage bucket "avatars", folder <user id>/

-- Pengetahuan primbon (baca: semua user yang login; tulis: hanya lewat migration)
hari            nama text pk, neptu int, urutan int        -- urutan 0 = minggu
pasaran         nama text pk, neptu int, urutan int        -- urutan 0 = legi
jodoh           sisa int pk (0-8), nama text, arti text, sumber text
watak           hari text, pasaran text, deskripsi text, sumber text,
                primary key (hari, pasaran)

-- AI
ai_settings     id (singleton), base_url, model, api_key_secret_id, updated_at
                -- API key terenkripsi di Supabase Vault, seperti Goukaku
app_settings    key, value jsonb
                -- 'ai_models': daftar model cadangan berurutan [{id, name}]
                -- 'limits': {per_user_per_day, guest_per_day, global_per_day, ai_enabled}
ai_usage        user_id, day, calls, primary key (user_id, day)
user_limits     user_id pk, ai_calls_per_day (null = default peran), unlimited bool, set_by, updated_at

-- Statistik
query_logs      id, user_id, created_at, input text,
                kalimat_baku text, jenis_kalimat, sumber ('rule' | 'rule_ai' | 'mbah' | 'gagal'),
                model text, durasi_ms int
```

Fungsi SQL (RPC), semuanya parameterized dan hanya `SELECT`:

- `primbon_neptu(p_hari, p_pasaran, p_tanggal)`
- `primbon_jodoh(p_hari_1, p_pasaran_1, p_tanggal_1, p_hari_2, p_pasaran_2, p_tanggal_2)`
- `weton_dari(p_hari, p_pasaran, p_tanggal)`: fungsi bantu, hari/pasaran/neptu dari nama weton atau dari tanggal
- `primbon_weton(p_tanggal)`
- `primbon_kapan(p_hari, p_pasaran, p_mulai, p_selesai)`
- `primbon_watak(p_hari, p_pasaran, p_tanggal)`
- `consume_ai_quota(p_user_id)`: secara atomik, urutannya: kill switch (berlaku untuk semua) → admin lolos tanpa limit → batas global (dihitung dari pemakaian non-admin) → user `unlimited` lolos dari limit per user → limit khusus di `user_limits` → default peran (`guest_per_day` / `per_user_per_day`). Lalu menambah `ai_usage`.
- `set_ai_api_key(p_key)` dan `get_ai_api_key()`: disalin dari Goukaku. `get_ai_api_key` hanya bisa dipanggil `service_role`.

### RLS

- Semua tabel memakai RLS.
- `hari`, `pasaran`, `jodoh`, `watak`: `SELECT` untuk `authenticated`. Tidak ada policy tulis.
- `profiles`: user membaca dan mengubah baris miliknya (kecuali `role`; tamu tidak bisa mengubah sama sekali). Admin membaca semua.
- `ai_settings`, `app_settings`, `user_limits`, `ai_usage`, `query_logs`: hanya admin (baca), penulisan lewat server dengan service role.
- Panggilan AI hanya dari server (Route Handler / Server Action). API key tidak pernah dikirim ke browser.

## 10. API

`POST /api/tanya`

- Body: `{ pesan: string, riwayat?: {peran, isi}[] }` (divalidasi dengan zod, maks 300 karakter, riwayat maks 10).
- Wajib login (401 jika tidak).
- Alur: preprocessing → Scanner → Parser → (gagal sintaks? cek kuota → Normalizer AI → Scanner → Parser) → Translator → Evaluator → simpan `query_logs`.
- Respons: `{ sumber, jawaban, jejak: { normalizer?, scanner, parser, translator, evaluator } }`. `jejak` dipakai panel tahapan.

## 11. Desain

Detail visual ada di `UI_RULES.md` (disusun dengan skill **ui-ux-pro-max**). Ringkasnya:

- **Hanya tema terang.** Tidak ada mode gelap, dan tidak mengikuti `prefers-color-scheme`. Tampilan harus terasa hangat dan terang, bukan gelap atau mistis.
- **Unsur Jawa yang halus**: motif batik (kawung atau parang) samar di latar, gunungan wayang sebagai animasi "Mbah sedang berpikir", aksara Jawa sebagai ornamen judul (dengan `aria-hidden` dan teks Latin di sampingnya), serta palet sogan (cokelat batik) dan emas di atas latar krem terang.
- **Animasi**: [motion.dev](https://motion.dev) (paket `motion`) dan komponen [Animate UI](https://animate-ui.com). Semua animasi menghormati `prefers-reduced-motion`.
- **Mobile dan desktop setara**: dirancang mobile-first. Input chat menempel di bawah dengan memperhitungkan *safe area* dan keyboard, target sentuh minimal 44 px, tanpa scroll horizontal di lebar 360 px. Di desktop, chat dan panel tahapan tampil berdampingan.
- **Aksesibilitas**: kontras teks minimal WCAG AA (4.5:1), fokus keyboard terlihat, dan label sumber jawaban tidak hanya mengandalkan warna.
- **Bahasa UI**: Bahasa Indonesia.

## 12. Stack

- **Next.js 16.4.3** (versi terbaru per 25 Oktober 2026, sudah memuat tambalan RCE Image Optimization dan `use cache` dari 16.4.1), App Router, TypeScript.
- **React 19**, **Tailwind CSS 4**, **motion**, **Animate UI**, **lucide-react**, **zod**.
- **Supabase**: Postgres, Auth, RLS, Storage (avatar), dan Vault (API key).
- **Vercel** untuk hosting, runtime **Node.js 24.x** (minimal 24.22.1, yang sudah menambal celah Brotli CVE-2026-111497).
- Tes: `node --test` untuk Scanner, Parser, Translator, dan perhitungan Evaluator.

## 13. Di luar cakupan

- Mode gelap.
- Pendaftaran mandiri dan akses tanpa login.
- Provider AI selain OpenAI-compatible (Anthropic, Gemini).
- Verifikasi jawaban dengan beberapa model.
- Aksara Jawa sebagai input.
- Penyimpanan riwayat chat per user (chat hilang saat halaman ditutup; hanya `query_logs` untuk statistik).
- Admin menyunting tabel pengetahuan dari UI (perubahan lewat migration).

## 14. Kriteria selesai

- Lima tipe kalimat baku dijawab benar oleh rule-based **tanpa** AI, dengan panel 4 tahap lengkap.
- Unit test lulus untuk minimal kasus berikut:
  - 17 Agustus 1945 → Jumat Legi; 17 Agustus 2003 → Minggu Kliwon; satu tanggal sebelum 1945.
  - Neptu Senin Legi = 9; Senin Legi + Jumat Kliwon → 23 → sisa 5 → Tinari; jumlah 9, 18, 27, 36 → Pegat; 17 → Pesthi.
  - "30 februari 2003" → gagal semantik, tidak memanggil AI.
  - Kalimat informal → gagal sintaks.
  - Kalimat hasil Normalizer yang tidak valid ditolak Parser.
- Kalimat informal di tabel 6.1 berhasil dijawab, dengan label "kalimat dirapikan AI".
- Fallback model bekerja saat model utama dimatikan.
- API key dan password asli akun tamu tidak pernah muncul di respons atau bundle browser.
- Semua halaman dan `/api/tanya` menolak pengunjung yang belum login.
- Login `tamu`/`tamu` berhasil, kuota tamu bersama berlaku, dan tamu tidak bisa mengubah profil atau password.
- Limit harian dan kill switch bekerja.
- Tampilan lolos pengecekan di lebar 360 px, 768 px, dan 1440 px, dan hanya tema terang.
- Semua tabel memakai RLS.

## 15. Pertanyaan terbuka

- Tanggal acuan 17 Agustus 1945 = Jumat Legi perlu dicocokkan sekali dengan kalender Jawa daring.
