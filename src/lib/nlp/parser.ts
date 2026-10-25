import { BULAN, type Hari, type Pasaran } from "./data.ts";
import { tanggalValid, type Tanggal } from "./kalender.ts";
import type { Token } from "./scanner.ts";

// Tahap 2: Parser recursive descent. Setiap fungsi di bawah adalah satu aturan produksi (PRD 5.3).

export type Simpul = { simbol: string; aturan?: string; teks?: string; opsional?: boolean; anak?: Simpul[] };
export type Subjek = { jenis: "weton"; hari: Hari; pasaran: Pasaran } | { jenis: "tanggal"; tanggal: Tanggal };
export type Waktu = { jenis: "berikutnya" } | { jenis: "bulan"; bulan: number; tahun: number };
export type Makna =
  | { jenis: "WETON"; tanggal: Tanggal }
  | { jenis: "NEPTU"; subjek: Subjek }
  | { jenis: "JODOH"; kiri: Subjek; kanan: Subjek }
  | { jenis: "KAPAN"; hari: Hari; pasaran: Pasaran; waktu: Waktu }
  | { jenis: "WATAK"; subjek: Subjek };
export type HasilParse = { makna: Makna; pohon: Simpul; aturan: string[] };

/** Kalimat tidak cocok dengan grammar. Hanya kegagalan ini yang boleh diteruskan ke Normalizer AI. */
export class GagalSintaks extends Error {
  posisi: number;
  constructor(pesan: string, posisi: number) {
    super(pesan);
    this.posisi = posisi;
  }
}

/** Kalimat cocok, tetapi nilainya mustahil (30 Februari, tahun 1850). Tidak diteruskan ke AI. */
export class GagalSemantik extends Error {}

export const TAHUN_MIN = 1900;
export const TAHUN_MAKS = 2100;

export const ATURAN: { kode: string; kiri: string; kanan: string }[] = [
  { kode: "R1", kiri: "<S>", kanan: "<Q_Weton> | <Q_Neptu> | <Q_Jodoh> | <Q_Kapan> | <Q_Watak>" },
  { kode: "R2", kiri: "<Q_Weton>", kanan: "apa weton [orang yang] [lahir] [pada] tanggal <Tanggal>" },
  { kode: "R3", kiri: "<Q_Neptu>", kanan: "berapa neptu <Subjek>" },
  { kode: "R4", kiri: "<Q_Jodoh>", kanan: "apakah <Subjek> cocok dengan <Subjek>" },
  { kode: "R5", kiri: "<Q_Kapan>", kanan: "kapan [weton] <Weton> <Waktu>" },
  { kode: "R6", kiri: "<Q_Watak>", kanan: "bagaimana watak [orang dengan] <Subjek>" },
  { kode: "R7", kiri: "<Subjek>", kanan: "[weton] <Weton> | [weton] [orang yang] [lahir] [pada] tanggal <Tanggal>" },
  { kode: "R8", kiri: "<Waktu>", kanan: "berikutnya | [di] bulan <Bulan> <Tahun>" },
  { kode: "R9", kiri: "<Weton>", kanan: "<Hari> <Pasaran>" },
  { kode: "R10", kiri: "<Hari>", kanan: "senin | selasa | rabu | kamis | jumat | sabtu | minggu" },
  { kode: "R11", kiri: "<Pasaran>", kanan: "legi | pahing | pon | wage | kliwon" },
  { kode: "R12", kiri: "<Tanggal>", kanan: "<Angka> <Bulan> <Tahun>" },
  { kode: "R13", kiri: "<Bulan>", kanan: "januari | februari | ... | desember" },
  { kode: "R14", kiri: `<Tahun>`, kanan: `<Angka>   (${TAHUN_MIN}-${TAHUN_MAKS})` },
];

export function parse(token: Token[]): HasilParse {
  let i = 0;
  const dipakai: string[] = [];
  const lihat = (k = 0) => token[i + k];
  const pakai = (r: string) => void (dipakai.includes(r) || dipakai.push(r));
  const daun = (teks: string, opsional = false): Simpul => ({ simbol: teks, teks, opsional });

  const gagal = (diharapkan: string): never => {
    const t = lihat();
    throw new GagalSintaks(t ? `Kata "${t.teks}" tidak sesuai aturan. Mbah mengharapkan ${diharapkan}.` : `Kalimatnya terpotong. Mbah mengharapkan ${diharapkan}.`, i);
  };
  const kata = (w: string) => {
    if (lihat()?.teks !== w) gagal(`"${w}"`);
    i++;
    return daun(w);
  };
  /** Kata opsional [w1 w2 ...]: dipakai hanya jika semuanya muncul berurutan. */
  const opsional = (...ws: string[]): Simpul[] => {
    if (!ws.every((w, k) => lihat(k)?.teks === w)) return [];
    i += ws.length;
    return ws.map((w) => daun(w, true));
  };
  const kelas = (k: Token["kelas"], nama: string) => {
    if (lihat()?.kelas !== k) gagal(nama);
    return token[i++].teks;
  };

  // R10, R11
  const hari = (): [Simpul, Hari] => {
    pakai("R10");
    const t = kelas("HARI", "nama hari (senin ... minggu)") as Hari;
    return [{ simbol: "<Hari>", aturan: "R10", anak: [daun(t)] }, t];
  };
  const pasaran = (): [Simpul, Pasaran] => {
    pakai("R11");
    const t = kelas("PASARAN", "pasaran (legi, pahing, pon, wage, kliwon)") as Pasaran;
    return [{ simbol: "<Pasaran>", aturan: "R11", anak: [daun(t)] }, t];
  };
  // R9
  const weton = (): [Simpul, Hari, Pasaran] => {
    pakai("R9");
    const [sh, h] = hari();
    const [sp, p] = pasaran();
    return [{ simbol: "<Weton>", aturan: "R9", anak: [sh, sp] }, h, p];
  };
  // R13
  const bulan = (): [Simpul, number] => {
    pakai("R13");
    const t = kelas("BULAN", "nama bulan (januari ... desember)");
    return [{ simbol: "<Bulan>", aturan: "R13", anak: [daun(t)] }, (BULAN as readonly string[]).indexOf(t) + 1];
  };
  // R14
  const tahun = (): [Simpul, number] => {
    pakai("R14");
    const t = kelas("ANGKA", "tahun (angka)");
    const y = Number(t);
    if (y < TAHUN_MIN || y > TAHUN_MAKS) throw new GagalSemantik(`Tahun ${y} di luar jangkauan Mbah (${TAHUN_MIN}-${TAHUN_MAKS}).`);
    return [{ simbol: "<Tahun>", aturan: "R14", anak: [daun(t)] }, y];
  };
  // R12
  const tanggal = (): [Simpul, Tanggal] => {
    pakai("R12");
    const d = kelas("ANGKA", "tanggal (angka)");
    const [sb, m] = bulan();
    const [st, y] = tahun();
    const t = { d: Number(d), m, y };
    if (!tanggalValid(t)) throw new GagalSemantik(`Tanggal ${t.d} ${BULAN[m - 1]} ${y} tidak ada di kalender.`);
    return [{ simbol: "<Tanggal>", aturan: "R12", anak: [daun(d), sb, st] }, t];
  };
  // R7
  const subjek = (): [Simpul, Subjek] => {
    pakai("R7");
    const anak = opsional("weton");
    if (lihat()?.kelas === "HARI") {
      const [sw, h, p] = weton();
      return [{ simbol: "<Subjek>", aturan: "R7", anak: [...anak, sw] }, { jenis: "weton", hari: h, pasaran: p }];
    }
    anak.push(...opsional("orang", "yang"), ...opsional("lahir"), ...opsional("pada"));
    if (lihat()?.teks !== "tanggal") gagal("weton (misalnya senin legi) atau kata \"tanggal\"");
    anak.push(kata("tanggal"));
    const [st, t] = tanggal();
    return [{ simbol: "<Subjek>", aturan: "R7", anak: [...anak, st] }, { jenis: "tanggal", tanggal: t }];
  };
  // R8
  const waktu = (): [Simpul, Waktu] => {
    pakai("R8");
    if (lihat()?.teks === "berikutnya") return [{ simbol: "<Waktu>", aturan: "R8", anak: [kata("berikutnya")] }, { jenis: "berikutnya" }];
    const anak = opsional("di");
    if (lihat()?.teks !== "bulan") gagal("\"berikutnya\" atau \"bulan <nama bulan> <tahun>\"");
    anak.push(kata("bulan"));
    const [sb, m] = bulan();
    const [st, y] = tahun();
    return [{ simbol: "<Waktu>", aturan: "R8", anak: [...anak, sb, st] }, { jenis: "bulan", bulan: m, tahun: y }];
  };

  // R1: kata tanya pertama menentukan tipe kalimat.
  pakai("R1");
  let q: Simpul;
  let makna: Makna;
  switch (lihat()?.teks) {
    case "apa": {
      pakai("R2");
      const anak = [kata("apa"), kata("weton"), ...opsional("orang", "yang"), ...opsional("lahir"), ...opsional("pada"), kata("tanggal")];
      const [st, t] = tanggal();
      q = { simbol: "<Q_Weton>", aturan: "R2", anak: [...anak, st] };
      makna = { jenis: "WETON", tanggal: t };
      break;
    }
    case "berapa": {
      pakai("R3");
      const anak = [kata("berapa"), kata("neptu")];
      const [ss, s] = subjek();
      q = { simbol: "<Q_Neptu>", aturan: "R3", anak: [...anak, ss] };
      makna = { jenis: "NEPTU", subjek: s };
      break;
    }
    case "apakah": {
      pakai("R4");
      const a = kata("apakah");
      const [s1, kiri] = subjek();
      const tengah = [kata("cocok"), kata("dengan")];
      const [s2, kanan] = subjek();
      q = { simbol: "<Q_Jodoh>", aturan: "R4", anak: [a, s1, ...tengah, s2] };
      makna = { jenis: "JODOH", kiri, kanan };
      break;
    }
    case "kapan": {
      pakai("R5");
      const anak = [kata("kapan"), ...opsional("weton")];
      const [sw, h, p] = weton();
      const [sk, w] = waktu();
      q = { simbol: "<Q_Kapan>", aturan: "R5", anak: [...anak, sw, sk] };
      makna = { jenis: "KAPAN", hari: h, pasaran: p, waktu: w };
      break;
    }
    case "bagaimana": {
      pakai("R6");
      const anak = [kata("bagaimana"), kata("watak"), ...opsional("orang", "dengan")];
      const [ss, s] = subjek();
      q = { simbol: "<Q_Watak>", aturan: "R6", anak: [...anak, ss] };
      makna = { jenis: "WATAK", subjek: s };
      break;
    }
    default:
      return gagal("kata tanya di awal: apa, berapa, apakah, kapan, atau bagaimana");
  }
  if (i < token.length) gagal("akhir kalimat");
  return { makna, pohon: { simbol: "<S>", aturan: "R1", anak: [q] }, aturan: dipakai };
}
