// Pengetahuan primbon (PRD 5.5). Sama dengan isi tabel di supabase/migrations; dipakai oleh
// Scanner (kosakata), halaman /cara-kerja, dan database tiruan di unit test.

export type Hari = "minggu" | "senin" | "selasa" | "rabu" | "kamis" | "jumat" | "sabtu";
export type Pasaran = "legi" | "pahing" | "pon" | "wage" | "kliwon";

/** Urutan 0 = Minggu, sama dengan Date.getUTCDay() dan extract(dow) di Postgres. */
export const HARI: { nama: Hari; neptu: number }[] = [
  { nama: "minggu", neptu: 5 },
  { nama: "senin", neptu: 4 },
  { nama: "selasa", neptu: 3 },
  { nama: "rabu", neptu: 7 },
  { nama: "kamis", neptu: 8 },
  { nama: "jumat", neptu: 6 },
  { nama: "sabtu", neptu: 9 },
];

/** Urutan 0 = Legi, karena tanggal acuan 17 Agustus 1945 adalah Jumat Legi. */
export const PASARAN: { nama: Pasaran; neptu: number }[] = [
  { nama: "legi", neptu: 5 },
  { nama: "pahing", neptu: 9 },
  { nama: "pon", neptu: 7 },
  { nama: "wage", neptu: 4 },
  { nama: "kliwon", neptu: 8 },
];

export const BULAN = [
  "januari",
  "februari",
  "maret",
  "april",
  "mei",
  "juni",
  "juli",
  "agustus",
  "september",
  "oktober",
  "november",
  "desember",
] as const;

export const SUMBER_JODOH =
  "Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).";

/** Indeks = (neptu_1 + neptu_2) mod 9. Sisa 0 dan 1 sama-sama Pegat (9, 10, 18, 19, ...). */
export const JODOH: { sisa: number; nama: string; arti: string }[] = [
  { sisa: 0, nama: "Pegat", arti: "Rumah tangga kemungkinan menghadapi banyak masalah, misalnya beda pendapat atau konflik. Anggap sebagai pengingat untuk menjaga komunikasi." },
  { sisa: 1, nama: "Pegat", arti: "Rumah tangga kemungkinan menghadapi banyak masalah, misalnya beda pendapat atau konflik. Anggap sebagai pengingat untuk menjaga komunikasi." },
  { sisa: 2, nama: "Ratu", arti: "Pasangan yang dihormati dan disegani lingkungan, dianggap cocok membangun hidup bersama." },
  { sisa: 3, nama: "Jodoh", arti: "Hasil yang paling diharapkan: cocok dan saling melengkapi." },
  { sisa: 4, nama: "Topo", arti: "Rumah tangga perlu perjuangan lebih besar di awal sebelum mencapai kestabilan." },
  { sisa: 5, nama: "Tinari", arti: "Membawa keberuntungan, rezeki, dan kemudahan." },
  { sisa: 6, nama: "Padu", arti: "Kemungkinan sering berbeda pendapat atau bertengkar. Pengingat untuk saling memahami." },
  { sisa: 7, nama: "Sujanan", arti: "Ujian dalam hubungan, seperti rasa curiga atau gangguan dari pihak luar." },
  { sisa: 8, nama: "Pesthi", arti: "Rumah tangga tenteram, harmonis, dan damai." },
];

export const SUMBER_WATAK =
  "detikJateng, \"35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa\" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.";

/** Watak per weton, kunci "hari pasaran". */
export const WATAK: Record<`${Hari} ${Pasaran}`, string> = {
  "senin kliwon": "Berprinsip dan rela berkorban untuk orang tersayang. Mudah tersinggung karena suka memendam perasaan.",
  "senin legi": "Berjiwa petualang dan sangat dermawan. Tidak suka mencampuri urusan orang, tetapi gemar berdebat.",
  "senin pahing": "Tegas, jujur, dan sulit dipengaruhi, tetapi cenderung boros.",
  "senin pon": "Tangguh, ramah, sopan, dan bertanggung jawab. Kadang suka memamerkan miliknya.",
  "senin wage": "Tenang dan sangat hati-hati mengambil keputusan. Saat kecewa mudah marah dan sulit menerima alasan.",
  "selasa kliwon": "Cerdas, kritis, dan pandai berkomunikasi, walau kadang kurang terampil di bidang tertentu.",
  "selasa legi": "Pendiam tetapi cerdik. Kadang kurang menghargai diri sendiri sehingga merasa rendah diri.",
  "selasa pahing": "Pemalu tetapi baik hati. Sulit memaafkan karena suka menyimpan dendam.",
  "selasa pon": "Tidak suka membesar-besarkan masalah dan ingin cepat menyelesaikannya. Cerdik, kadang kebablasan.",
  "selasa wage": "Pandai menabung dan mengatur uang. Sulit diatur dan tidak suka dinasihati.",
  "rabu kliwon": "Pemikir yang peka dan mudah disukai. Kadang bicaranya berlebihan sehingga membuat orang kurang nyaman.",
  "rabu legi": "Santun, memegang prinsip, dan menjunjung kejujuran. Dikagumi banyak orang.",
  "rabu pahing": "Matang menimbang dan perfeksionis. Pantang menyerah, tetapi mudah curiga.",
  "rabu pon": "Gigih dan mudah bergaul. Suka pamer sehingga bisa dijauhi orang.",
  "rabu wage": "Baik hati, ramah, dan jujur, tetapi tutur katanya kadang keras dan agak pelit.",
  "kamis kliwon": "Imajinatif, optimistis, dan mudah diterima orang. Sering gelisah karena banyak rencana besar.",
  "kamis legi": "Pekerja keras yang berpikir jangka panjang. Kekurangannya, haus akan pujian.",
  "kamis pahing": "Ambisius dan jeli melihat peluang demi keluarga. Kadang menyimpulkan tanpa memeriksa fakta.",
  "kamis pon": "Cerdas dan suka belajar hal baru. Kurang peduli urusan orang lain dan agak sulit bergaul.",
  "kamis wage": "Pintar dan sopan, tetapi terpaku pada caranya sendiri dan kurang menghargai saran.",
  "jumat kliwon": "Sabar, dermawan, dan disukai. Berbakat memimpin, tetapi cenderung membesar-besarkan omongan.",
  "jumat legi": "Jujur, setia, dan dermawan kepada orang tercinta, walau kadang kurang memikirkan perasaan orang lain.",
  "jumat pahing": "Menyenangkan diajak bicara, jujur, dan gigih. Keras kepala jika keinginannya tidak terpenuhi.",
  "jumat pon": "Mengayomi, tenang, dan bergaul dengan berbagai kalangan. Kurang percaya diri sehingga mudah terpengaruh.",
  "jumat wage": "Mudah iba, tulus, rendah hati, dan selalu siap membantu, tetapi keras kepala dan sulit menerima saran.",
  "sabtu kliwon": "Ramah serta pandai berbicara dan menulis. Kurang berani sehingga mudah menyerah sebelum mulai.",
  "sabtu legi": "Cerdik dan terbuka pada pandangan orang lain. Menyukai gaya hidup mewah dan berkualitas.",
  "sabtu pahing": "Bersemangat tinggi dan siap membantu, mudah mengakui kesalahan, tetapi gampang naik darah dan ceroboh.",
  "sabtu pon": "Egonya besar dan mengejar kekuasaan serta ketenaran, tetapi mudah memaafkan dan tidak pelit.",
  "sabtu wage": "Teguh pendirian, murah hati, dan setia, tetapi agak pencemburu.",
  "minggu kliwon": "Pendiam, berpendirian kuat, dan pandai bersosialisasi. Sulit ditebak dan suka menduga-duga.",
  "minggu legi": "Tertutup sehingga isi hatinya sulit dipahami. Tegas, tenang, dan mampu mengendalikan situasi.",
  "minggu pahing": "Kuat memegang prinsip dan dihormati lingkungan, tetapi suka memendam perasaan.",
  "minggu pon": "Sensitif dan cenderung tertutup untuk melindungi perasaannya.",
  "minggu wage": "Penuh pertimbangan dan perencana yang baik, tetapi agak keras kepala dan mudah marah.",
};

export const neptuHari =(h: Hari) => HARI.find((x) => x.nama === h)!.neptu;
export const neptuPasaran = (p: Pasaran) => PASARAN.find((x) => x.nama === p)!.neptu;
export const judul = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
