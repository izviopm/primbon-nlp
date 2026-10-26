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

export const SUMBER_WATAK_HARI_PASARAN =
  "ki-demang.com, Almanak Jawa (bagian Watak berdasarkan Weton: Dina dan Pasaran). Teks diparafrasakan ke bahasa sehari-hari.";

/** Watak menurut hari lahir saja. */
export const WATAK_HARI: Record<Hari, string> = {
  minggu: "Rajin, mandiri, dan punya wibawa.",
  senin: "Suasana hatinya mudah berubah, tetapi menawan dan disukai banyak orang.",
  selasa: "Pergaulannya luas, tetapi mudah marah dan gampang curiga.",
  rabu: "Tenang, sabar, dan suka mengayomi orang lain.",
  kamis: "Penampilannya tegas sampai terkesan galak, sehingga orang segan kepadanya.",
  jumat: "Penuh semangat dan meninggalkan kesan yang kuat.",
  sabtu: "Membuat orang di sekitarnya senang, tetapi sikapnya sulit ditebak.",
};

/** Watak menurut pasaran lahir saja. */
export const WATAK_PASARAN: Record<Pasaran, string> = {
  legi: "Bertanggung jawab, dermawan, mudah bergaul, dan ceria. Ucapannya berbobot dan kuat begadang, tetapi kadang bingung sendiri dan mudah jadi sasaran gosip. Hidupnya sering naik-turun.",
  pahing: "Pandai berhitung untung-rugi, suka menolong, tahan lapar, dan menjaga kebersihan. Namun mudah tersinggung, sering berselisih, dan kadang mudah tertipu.",
  pon: "Ucapannya mudah diterima orang, betah di rumah, dan berani menyampaikan pendapat yang berbeda, bahkan kepada atasan. Agak suka berdebat. Rezekinya cukup.",
  wage: "Menarik dan setia, mudah diarahkan, tetapi bisa tinggi hati dan keras kepala. Kurang memikirkan akibat jangka panjang dan kadang kurang giat mencari nafkah.",
  kliwon: "Pandai bicara, mudah akrab, ceria, dan bercita-cita tinggi. Kadang ceplas-ceplos dan kurang teliti soal makanan, tetapi menepati janji dan sering dianggap beruntung.",
};

export const SUMBER_WUKU =
  "detikJateng, \"30 Nama Wuku dalam Kalender Jawa Beserta Arti dan Cara Menghitungnya\" (30 Mei 2025), merujuk Horoskop Jawa (Suroso Aji Pamungkas) dan Primbon Masa Kini. Teks diparafrasakan.";

/** Tanggal acuan awal siklus wuku: wuku Sinta dimulai Minggu Pahing, 17 Desember 2000 (cocok dengan 5 Juli 2020 dan ki-demang 28 Maret 2001). */
export const ACUAN_WUKU = "2000-12-17";

/** 30 wuku berurutan; tiap wuku 7 hari, satu putaran 210 hari. */
export const WUKU: { nama: string; dewa: string; watak: string }[] = [
  { nama: "Sinta", dewa: "Batara Yamadipati", watak: "Terlihat bijak dan berambisi. Awalnya lembut lalu bisa jadi keras, agak keras kepala, dan mudah stres." },
  { nama: "Landep", dewa: "Batara Mahadewa", watak: "Rupawan, tenang, dan ceria. Tegas di awal lalu melunak, tetapi suka memamerkan apa yang dimiliki." },
  { nama: "Wukir", dewa: "Batara Mahayekti", watak: "Berjiwa besar, dermawan, dan berbakat seni, tetapi wataknya sulit dipahami orang." },
  { nama: "Kurantil", dewa: "Batara Langsur", watak: "Pandai mengambil hati orang dan teguh pendirian, tetapi boros sehingga rezekinya naik-turun." },
  { nama: "Tolu", dewa: "Batara Bayu", watak: "Lugas dan menyenangkan, tetapi bisa sombong dan cepat marah. Keberuntungannya datang di hari tua." },
  { nama: "Gumbreg", dewa: "Batara Cakra", watak: "Kemauannya keras, jujur, dan murah hati. Melindungi keluarga, tetapi suka berdebat." },
  { nama: "Warigalit", dewa: "Batara Asmara", watak: "Menawan dan digemari, tetapi pencemburu, mudah jatuh cinta, dan suka menyendiri." },
  { nama: "Warigagung", dewa: "Batara Maharesi", watak: "Bertanggung jawab dan dipercaya orang, pandai bicara, dan tegas dalam ucapan." },
  { nama: "Julungwangi", dewa: "Batara Sambu", watak: "Dermawan dan pandai meyakinkan orang, tetapi agak angkuh dan mudah bosan sehingga kadang ingkar janji." },
  { nama: "Sungsang", dewa: "Batara Gana", watak: "Cerdas, kuat, dan dermawan, tetapi cenderung boros dan kadang menginginkan milik orang lain." },
  { nama: "Galungan", dewa: "Batara Kamajaya", watak: "Berwajah menarik, tulus, dan suka memberi, tetapi temperamental dan senang bersaing." },
  { nama: "Kuningan", dewa: "Batara Indra", watak: "Berbudi luhur, berwibawa, teliti, dan hemat, tetapi pemalu dan kadang kurang terus terang." },
  { nama: "Langkir", dewa: "Batara Kala", watak: "Berani, tetapi keras kepala dan sulit didekati. Banyak bicara namun kurang bertindak." },
  { nama: "Mandasiya", dewa: "Batara Brahma", watak: "Tegas, punya harga diri tinggi, sabar, dan melindungi orang lain, tetapi sulit meredam amarah." },
  { nama: "Julungpujut", dewa: "Batara Guritna", watak: "Suka keramaian dan sopan, berambisi besar, tetapi usahanya sering kurang membuahkan hasil." },
  { nama: "Pahang", dewa: "Batara Tantra", watak: "Berwibawa dan disegani, pendiam, dan gigih, dengan ambisi yang disimpan rapat." },
  { nama: "Kuruwelut", dewa: "Batara Wisnu", watak: "Supel, cermat, dan disukai banyak orang, tetapi mudah percaya sehingga gampang dimanfaatkan." },
  { nama: "Marakeh", dewa: "Batara Surenggana", watak: "Pendiam dan halus perasaannya, tekun, berintuisi tajam, dan selalu berhati-hati." },
  { nama: "Tambir", dewa: "Batara Siwa", watak: "Pemikir yang tenang dan spiritual. Lebih suka bekerja di balik layar, tetapi hasilnya nyata." },
  { nama: "Medangkungan", dewa: "Batara Basuki", watak: "Tangguh, pekerja keras, dan setia. Mampu memimpin kelompok kecil dan lembut kepada orang terdekat." },
  { nama: "Maktal", dewa: "Batara Sakri", watak: "Gigih, berwibawa, santun, dan disayangi atasan, tetapi suka menyendiri dan rawan berselisih." },
  { nama: "Wuye", dewa: "Batara Kuwera", watak: "Pandai memikat dan meyakinkan, kuat, dan waspada, tetapi mudah marah dan kadang cemburu." },
  { nama: "Manahil", dewa: "Batara Citragotra", watak: "Pandai bergaul, praktis, dan hemat, tetapi sering disalahpahami dan kadang agak malas." },
  { nama: "Prangbakat", dewa: "Batara Bisma", watak: "Tegas dan terampil, beruntung dan panjang umur, tetapi agak kaku, pemalu, dan kadang congkak." },
  { nama: "Bala", dewa: "Batari Durga", watak: "Dekat dengan orang berpengaruh, tetapi suka membuat keributan dan rezekinya tidak menentu." },
  { nama: "Wugu", dewa: "Batara Singajalma", watak: "Lapang dada, bijak, rendah hati, dan rezekinya lancar, tetapi kadang tanpa sadar mengecewakan orang dekat." },
  { nama: "Wayang", dewa: "Batari Sri", watak: "Menawan, peka perasaan orang, teliti, sabar, dan dermawan, tetapi ada sisi suka menyendiri." },
  { nama: "Kulawu", dewa: "Batara Sadana", watak: "Berani, murah hati, teguh, dan riang, tetapi kurang memperhitungkan risiko. Dipercaya berumur panjang." },
  { nama: "Dukut", dewa: "Batara Baruna", watak: "Disiplin dan keras seperti prajurit, cerdas, dan setia, tetapi bisa tamak sehingga kurang disukai." },
  { nama: "Watugunung", dewa: "Batara Anantaboga", watak: "Banyak keinginan, suka berdebat, religius, dan romantis, tetapi cenderung menyendiri." },
];

/** Penjelasan istilah untuk orang yang tidak akrab dengan budaya Jawa. */
export const ISTILAH: Record<string, string> = {
  weton: "Gabungan hari lahir (Senin-Minggu) dan hari pasaran Jawa. Ada 35 kombinasi, berulang tiap 35 hari.",
  pasaran: "Pekan Jawa yang berisi 5 hari: Legi, Pahing, Pon, Wage, Kliwon. Berjalan berdampingan dengan 7 hari biasa.",
  neptu: "Nilai angka untuk hari dan pasaran. Dijumlahkan untuk menghitung kecocokan, hari baik, dan sejenisnya.",
  wuku: "Pekan dalam kalender Jawa kuno: 30 wuku bergiliran, masing-masing 7 hari, sehingga satu putaran 210 hari. Tiap wuku punya dewa pelindung dan watak sendiri.",
  "dewa pelindung": "Tokoh dewa dalam tradisi Jawa yang dipercaya menaungi wuku tersebut. Dipakai sebagai simbol watak.",
};

export const neptuHari = (h: Hari) => HARI.find((x) => x.nama === h)!.neptu;
export const neptuPasaran = (p: Pasaran) => PASARAN.find((x) => x.nama === p)!.neptu;
export const judul = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
