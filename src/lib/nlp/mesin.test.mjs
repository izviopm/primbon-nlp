import { test } from "node:test";
import assert from "node:assert/strict";
import { jalankanMemori } from "./db-memori.ts";
import { WUKU } from "./data.ts";
import { wetonDari, wukuDari } from "./kalender.ts";
import { prosesRule } from "./mesin.ts";
import { scan } from "./scanner.ts";

const HARI_INI = { d: 25, m: 10, y: 2026 };
const tanya = (k) => prosesRule(k, jalankanMemori, HARI_INI);
const ok = async (k) => {
  const r = await tanya(k);
  assert.equal(r.status, "ok", `${k}: ${r.pesan}`);
  return r;
};

test("tanggal acuan dan contoh weton", () => {
  assert.deepEqual(wetonDari({ d: 17, m: 8, y: 1945 }), { hari: "jumat", pasaran: "legi" });
  assert.deepEqual(wetonDari({ d: 17, m: 8, y: 2003 }), { hari: "minggu", pasaran: "kliwon" });
  assert.deepEqual(wetonDari({ d: 25, m: 10, y: 2026 }), { hari: "minggu", pasaran: "kliwon" });
  // Sebelum tanggal acuan: 35 hari sebelumnya (satu siklus) harus Jumat Legi lagi.
  assert.deepEqual(wetonDari({ d: 13, m: 7, y: 1945 }), { hari: "jumat", pasaran: "legi" });
  assert.deepEqual(wetonDari({ d: 1, m: 1, y: 1900 }).hari, "senin");
});

test("wuku: acuan dicocokkan dengan tiga sumber", () => {
  const nama = (d, m, y) => WUKU[wukuDari({ d, m, y })].nama;
  assert.equal(nama(17, 12, 2000), "Sinta"); // Minggu Pahing, awal siklus
  assert.equal(nama(5, 7, 2020), "Sinta"); // kalenderku.id
  assert.equal(nama(28, 3, 2001), "Julungpujut"); // ki-demang.com
  assert.equal(nama(24, 3, 2001), "Mandasiya"); // Sabtu sebelum minggu Julungpujut
  assert.equal(nama(16, 12, 2000), "Watugunung"); // sehari sebelum acuan: wuku terakhir
  assert.equal(WUKU.length, 30);
});

test("WETON dari tanggal", async () => {
  const r = await ok("Apa weton orang yang lahir tanggal 17 Agustus 2003?");
  assert.equal(r.jawaban.judul, "Minggu Kliwon");
  assert.deepEqual(r.jejak.parser.aturan, ["R1", "R2", "R12", "R13", "R14"]);
  // Kartu weton lengkap: hari, pasaran, weton, dan wuku, plus penjelasan istilah.
  assert.deepEqual(r.jawaban.rincian.map((x) => x.label), ["Hari lahir", "Pasaran", "Weton (gabungan)", `Wuku ke-${wukuDari({ d: 17, m: 8, y: 2003 }) + 1} dari 30`]);
  assert.ok(r.jawaban.istilah.some((x) => x.kata === "Wuku"));
});

test("NEPTU dari weton dan dari tanggal", async () => {
  assert.equal((await ok("berapa neptu weton senin legi")).jawaban.judul, "Neptu 9");
  assert.equal((await ok("berapa neptu orang yang lahir tanggal 17/08/1945")).jawaban.judul, "Neptu 11");
});

test("JODOH: mod 9, sisa 0 dan 1 Pegat", async () => {
  const r = await ok("Apakah weton Senin Legi cocok dengan Jumat Kliwon?");
  assert.equal(r.jawaban.judul, "Tinari");
  assert.match(r.jawaban.rumus, /= 23 → 23 mod 9 = 5 → Tinari/);
  // Selasa Wage (7) + Senin Pahing (13) = 20 → Ratu; Sabtu Pahing (18) + Sabtu Pahing (18) = 36 → Pegat.
  assert.equal((await ok("apakah selasa wage cocok dengan senin pahing")).jawaban.judul, "Ratu");
  assert.equal((await ok("apakah sabtu pahing cocok dengan sabtu pahing")).jawaban.judul, "Pegat");
  // Jumat Legi (11) + Senin Wage (8) = 19 → sisa 1 → Pegat; Minggu Legi (10) + Senin Wage (8) = 18 → sisa 0 → Pegat.
  assert.equal((await ok("apakah jumat legi cocok dengan senin wage")).jawaban.judul, "Pegat");
  assert.equal((await ok("apakah minggu legi cocok dengan senin wage")).jawaban.judul, "Pegat");
  // 17 → Pesthi: Selasa Wage (7) + Minggu Legi (10).
  assert.equal((await ok("apakah selasa wage cocok dengan minggu legi")).jawaban.judul, "Pesthi");
  // Subjek berupa tanggal: Jumat Legi (11) + Minggu Kliwon (13) = 24 → sisa 6 → Padu.
  assert.equal((await ok("apakah weton tanggal 17 agustus 1945 cocok dengan weton tanggal 17 agustus 2003")).jawaban.judul, "Padu");
});

test("KAPAN berikutnya dan per bulan", async () => {
  assert.equal((await ok("kapan jumat kliwon berikutnya")).jawaban.judul, "30 Oktober 2026");
  assert.equal((await ok("kapan minggu kliwon berikutnya")).jawaban.judul, "Hari ini!");
  assert.equal((await ok("kapan jumat kliwon di bulan desember 2026")).jawaban.judul, "4 Desember 2026");
});

test("WATAK", async () => {
  const r = await ok("bagaimana watak orang dengan weton rabu pon");
  assert.equal(r.jawaban.judul, "Watak Rabu Pon");
  assert.match(r.jawaban.isi, /Gigih/);
  // Tanpa tanggal, wuku tidak bisa dihitung.
  assert.equal(r.jawaban.rincian.length, 3);
  const t = await ok("bagaimana watak orang yang lahir tanggal 28 maret 2001");
  assert.equal(t.jawaban.judul, "Watak Rabu Pon");
  assert.match(t.jawaban.rincian[3].judul, /Julungpujut/);
});

test("sinonim dan format tanggal di Scanner", () => {
  assert.equal(scan("Gimana watak Jum'at Manis?").praproses, "bagaimana watak jumat legi");
  assert.equal(scan("apa weton tgl 1-1-2004").praproses, "apa weton tanggal 1 januari 2004");
});

test("gagal semantik tidak diteruskan ke AI", async () => {
  const r = await tanya("apa weton orang yang lahir tanggal 30 februari 2003");
  assert.equal(r.status, "gagal_semantik");
  assert.equal((await tanya("berapa neptu tanggal 1 januari 1850")).status, "gagal_semantik");
});

test("kalimat informal gagal sintaks", async () => {
  for (const k of ["aku senin legi pacarku jumat kliwon cocok ga", "wetonku apa ya", "", "apa weton senin legi", "berapa neptu senin legi dong"]) {
    assert.equal((await tanya(k)).status, "gagal_sintaks", k);
  }
});
