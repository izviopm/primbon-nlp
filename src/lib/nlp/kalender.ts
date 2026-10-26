import { ACUAN_WUKU, BULAN, HARI, PASARAN, type Hari, type Pasaran } from "./data.ts";

export type Tanggal = { d: number; m: number; y: number }; // m: 1-12

const HARI_MS = 86_400_000;
const ACUAN = Date.UTC(1945, 7, 17); // Jumat Legi

const utc = (t: Tanggal) => Date.UTC(t.y, t.m - 1, t.d);
const dariUtc = (ms: number): Tanggal => {
  const x = new Date(ms);
  return { d: x.getUTCDate(), m: x.getUTCMonth() + 1, y: x.getUTCFullYear() };
};

export function tanggalValid(t: Tanggal) {
  const x = new Date(utc(t));
  return x.getUTCFullYear() === t.y && x.getUTCMonth() === t.m - 1 && x.getUTCDate() === t.d;
}

/** Hari dari kalender Masehi, pasaran dari selisih hari terhadap 17 Agustus 1945 (siklus 5). */
export function wetonDari(t: Tanggal): { hari: Hari; pasaran: Pasaran } {
  const selisih = Math.round((utc(t) - ACUAN) / HARI_MS);
  return { hari: HARI[new Date(utc(t)).getUTCDay()].nama, pasaran: PASARAN[((selisih % 5) + 5) % 5].nama };
}

/** Urutan wuku 0-29 (0 = Sinta): minggu ke berapa dalam siklus 210 hari sejak ACUAN_WUKU. */
export function wukuDari(t: Tanggal): number {
  const selisih = Math.round((utc(t) - utc(dariIso(ACUAN_WUKU))) / HARI_MS);
  return Math.floor((((selisih % 210) + 210) % 210) / 7);
}

export const tambahHari =(t: Tanggal, n: number) => dariUtc(utc(t) + n * HARI_MS);
export const banding = (a: Tanggal, b: Tanggal) => utc(a) - utc(b);
export const iso = (t: Tanggal) => `${t.y}-${String(t.m).padStart(2, "0")}-${String(t.d).padStart(2, "0")}`;
export const dariIso = (s: string): Tanggal => {
  const [y, m, d] = s.split("-").map(Number);
  return { y, m, d };
};
export const formatTanggal = (t: Tanggal) => `${t.d} ${BULAN[t.m - 1].charAt(0).toUpperCase()}${BULAN[t.m - 1].slice(1)} ${t.y}`;
export const hariTerakhir = (m: number, y: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();

/** "Hari ini" selalu menurut Asia/Jakarta, bukan zona server (Vercel memakai UTC). */
export function hariIni(now = new Date()): Tanggal {
  return dariIso(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(now));
}
