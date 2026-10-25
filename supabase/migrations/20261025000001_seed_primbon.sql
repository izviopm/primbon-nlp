-- Data primbon dari src/lib/nlp/data.ts (dibuat oleh scripts/seed-sql.mjs, jangan diedit manual). Sumber: PRD 5.5.

insert into public.hari (nama, neptu, urutan) values
  ('minggu', 5, 0),
  ('senin', 4, 1),
  ('selasa', 3, 2),
  ('rabu', 7, 3),
  ('kamis', 8, 4),
  ('jumat', 6, 5),
  ('sabtu', 9, 6);

insert into public.pasaran (nama, neptu, urutan) values
  ('legi', 5, 0),
  ('pahing', 9, 1),
  ('pon', 7, 2),
  ('wage', 4, 3),
  ('kliwon', 8, 4);

insert into public.jodoh (sisa, nama, arti, sumber) values
  (0, 'Pegat', 'Rumah tangga kemungkinan menghadapi banyak masalah, misalnya beda pendapat atau konflik. Anggap sebagai pengingat untuk menjaga komunikasi.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (1, 'Pegat', 'Rumah tangga kemungkinan menghadapi banyak masalah, misalnya beda pendapat atau konflik. Anggap sebagai pengingat untuk menjaga komunikasi.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (2, 'Ratu', 'Pasangan yang dihormati dan disegani lingkungan, dianggap cocok membangun hidup bersama.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (3, 'Jodoh', 'Hasil yang paling diharapkan: cocok dan saling melengkapi.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (4, 'Topo', 'Rumah tangga perlu perjuangan lebih besar di awal sebelum mencapai kestabilan.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (5, 'Tinari', 'Membawa keberuntungan, rezeki, dan kemudahan.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (6, 'Padu', 'Kemungkinan sering berbeda pendapat atau bertengkar. Pengingat untuk saling memahami.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (7, 'Sujanan', 'Ujian dalam hubungan, seperti rasa curiga atau gangguan dari pihak luar.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).'),
  (8, 'Pesthi', 'Rumah tangga tenteram, harmonis, dan damai.', 'Rentang angka: Bisnis.com (kabar24.bisnis.com, 6 Nov 2024). Arti: Pegadaian (pegadaian.co.id, Hitungan Weton Jawa untuk Pernikahan).');

insert into public.watak (hari, pasaran, deskripsi, sumber) values
  ('senin', 'kliwon', 'Berprinsip dan rela berkorban untuk orang tersayang. Mudah tersinggung karena suka memendam perasaan.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('senin', 'legi', 'Berjiwa petualang dan sangat dermawan. Tidak suka mencampuri urusan orang, tetapi gemar berdebat.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('senin', 'pahing', 'Tegas, jujur, dan sulit dipengaruhi, tetapi cenderung boros.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('senin', 'pon', 'Tangguh, ramah, sopan, dan bertanggung jawab. Kadang suka memamerkan miliknya.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('senin', 'wage', 'Tenang dan sangat hati-hati mengambil keputusan. Saat kecewa mudah marah dan sulit menerima alasan.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('selasa', 'kliwon', 'Cerdas, kritis, dan pandai berkomunikasi, walau kadang kurang terampil di bidang tertentu.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('selasa', 'legi', 'Pendiam tetapi cerdik. Kadang kurang menghargai diri sendiri sehingga merasa rendah diri.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('selasa', 'pahing', 'Pemalu tetapi baik hati. Sulit memaafkan karena suka menyimpan dendam.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('selasa', 'pon', 'Tidak suka membesar-besarkan masalah dan ingin cepat menyelesaikannya. Cerdik, kadang kebablasan.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('selasa', 'wage', 'Pandai menabung dan mengatur uang. Sulit diatur dan tidak suka dinasihati.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('rabu', 'kliwon', 'Pemikir yang peka dan mudah disukai. Kadang bicaranya berlebihan sehingga membuat orang kurang nyaman.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('rabu', 'legi', 'Santun, memegang prinsip, dan menjunjung kejujuran. Dikagumi banyak orang.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('rabu', 'pahing', 'Matang menimbang dan perfeksionis. Pantang menyerah, tetapi mudah curiga.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('rabu', 'pon', 'Gigih dan mudah bergaul. Suka pamer sehingga bisa dijauhi orang.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('rabu', 'wage', 'Baik hati, ramah, dan jujur, tetapi tutur katanya kadang keras dan agak pelit.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('kamis', 'kliwon', 'Imajinatif, optimistis, dan mudah diterima orang. Sering gelisah karena banyak rencana besar.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('kamis', 'legi', 'Pekerja keras yang berpikir jangka panjang. Kekurangannya, haus akan pujian.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('kamis', 'pahing', 'Ambisius dan jeli melihat peluang demi keluarga. Kadang menyimpulkan tanpa memeriksa fakta.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('kamis', 'pon', 'Cerdas dan suka belajar hal baru. Kurang peduli urusan orang lain dan agak sulit bergaul.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('kamis', 'wage', 'Pintar dan sopan, tetapi terpaku pada caranya sendiri dan kurang menghargai saran.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('jumat', 'kliwon', 'Sabar, dermawan, dan disukai. Berbakat memimpin, tetapi cenderung membesar-besarkan omongan.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('jumat', 'legi', 'Jujur, setia, dan dermawan kepada orang tercinta, walau kadang kurang memikirkan perasaan orang lain.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('jumat', 'pahing', 'Menyenangkan diajak bicara, jujur, dan gigih. Keras kepala jika keinginannya tidak terpenuhi.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('jumat', 'pon', 'Mengayomi, tenang, dan bergaul dengan berbagai kalangan. Kurang percaya diri sehingga mudah terpengaruh.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('jumat', 'wage', 'Mudah iba, tulus, rendah hati, dan selalu siap membantu, tetapi keras kepala dan sulit menerima saran.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('sabtu', 'kliwon', 'Ramah serta pandai berbicara dan menulis. Kurang berani sehingga mudah menyerah sebelum mulai.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('sabtu', 'legi', 'Cerdik dan terbuka pada pandangan orang lain. Menyukai gaya hidup mewah dan berkualitas.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('sabtu', 'pahing', 'Bersemangat tinggi dan siap membantu, mudah mengakui kesalahan, tetapi gampang naik darah dan ceroboh.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('sabtu', 'pon', 'Egonya besar dan mengejar kekuasaan serta ketenaran, tetapi mudah memaafkan dan tidak pelit.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('sabtu', 'wage', 'Teguh pendirian, murah hati, dan setia, tetapi agak pencemburu.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('minggu', 'kliwon', 'Pendiam, berpendirian kuat, dan pandai bersosialisasi. Sulit ditebak dan suka menduga-duga.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('minggu', 'legi', 'Tertutup sehingga isi hatinya sulit dipahami. Tegas, tenang, dan mampu mengendalikan situasi.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('minggu', 'pahing', 'Kuat memegang prinsip dan dihormati lingkungan, tetapi suka memendam perasaan.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('minggu', 'pon', 'Sensitif dan cenderung tertutup untuk melindungi perasaannya.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.'),
  ('minggu', 'wage', 'Penuh pertimbangan dan perencana yang baik, tetapi agak keras kepala dan mudah marah.', 'detikJateng, "35 Weton Hari Lahir dan Kepribadiannya Berdasarkan Primbon Jawa" (14 Okt 2025), merujuk Primbon Praktis (Mama Flo) dan dua buku kepribadian. Teks diparafrasakan.');
