import { BULAN, HARI, PASARAN } from "./data.ts";

// Tahap 1: Scanner (PRD 5.1 dan 5.2). Preprocessing lalu memberi kelas pada setiap token.

export type Kelas = "KATA_TANYA" | "KATA_KUNCI" | "HARI" | "PASARAN" | "BULAN" | "ANGKA" | "PENGHUBUNG" | "TIDAK_DIKENAL";
export type Token = { teks: string; kelas: Kelas; posisi: number };
export type HasilScan = { asli: string; praproses: string; langkah: string[]; token: Token[] };

export const MAKS_KARAKTER = 300;

const KATA_TANYA = ["apa", "berapa", "apakah", "kapan", "bagaimana"];
const KATA_KUNCI = ["weton", "neptu", "cocok", "watak", "lahir", "tanggal", "berikutnya", "bulan"];
const PENGHUBUNG = ["orang", "yang", "pada", "di", "dengan"];

/** Kamus sinonim (rule-based): bentuk tidak baku → bentuk baku yang dikenal grammar. */
export const SINONIM: Record<string, string> = {
  ahad: "minggu",
  manis: "legi",
  kaliwon: "kliwon",
  paing: "pahing",
  jan: "januari",
  feb: "februari",
  pebruari: "februari",
  mar: "maret",
  apr: "april",
  jun: "juni",
  jul: "juli",
  agt: "agustus",
  agu: "agustus",
  ags: "agustus",
  agust: "agustus",
  sep: "september",
  sept: "september",
  okt: "oktober",
  nov: "november",
  nopember: "november",
  des: "desember",
  gimana: "bagaimana",
  bagaimanakah: "bagaimana",
  brp: "berapa",
  berapakah: "berapa",
  kapankah: "kapan",
  tgl: "tanggal",
  bln: "bulan",
  yg: "yang",
  dgn: "dengan",
  dg: "dengan",
  sama: "dengan",
  selanjutnya: "berikutnya",
  terdekat: "berikutnya",
};

const kelasDari = (t: string): Kelas => {
  if (KATA_TANYA.includes(t)) return "KATA_TANYA";
  if (KATA_KUNCI.includes(t)) return "KATA_KUNCI";
  if (HARI.some((h) => h.nama === t)) return "HARI";
  if (PASARAN.some((p) => p.nama === t)) return "PASARAN";
  if ((BULAN as readonly string[]).includes(t)) return "BULAN";
  if (/^\d+$/.test(t)) return "ANGKA";
  if (PENGHUBUNG.includes(t)) return "PENGHUBUNG";
  return "TIDAK_DIKENAL";
};

export function scan(input: string): HasilScan {
  const langkah: string[] = [];
  let s = input.toLowerCase();
  langkah.push(`Huruf kecil: "${s}"`);

  // Tanggal angka (17/8/2003, 17-08-2003, 17.08.2003) diubah dulu, sebelum tanda bacanya dibuang.
  const tgl = s.replace(/\b(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/g, (m, d, b, y) => (Number(b) >= 1 && Number(b) <= 12 ? `${Number(d)} ${BULAN[Number(b) - 1]} ${y}` : m));
  if (tgl !== s) langkah.push(`Normalisasi tanggal angka: "${tgl}"`);
  s = tgl;

  // Apostrof dihapus tanpa spasi (jum'at → jumat); tanda baca lain diganti spasi.
  s = s.replace(/['’`]/g, "").replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  langkah.push(`Buang tanda baca: "${s}"`);

  const kata = s ? s.split(" ") : [];
  const ganti: string[] = [];
  const baku = kata.map((k) => {
    const g = SINONIM[k];
    if (g) ganti.push(`${k} → ${g}`);
    return g ?? k;
  });
  if (ganti.length) langkah.push(`Kamus sinonim: ${ganti.join(", ")}`);

  return {
    asli: input,
    praproses: baku.join(" "),
    langkah,
    token: baku.map((teks, posisi) => ({ teks, kelas: kelasDari(teks), posisi })),
  };
}
