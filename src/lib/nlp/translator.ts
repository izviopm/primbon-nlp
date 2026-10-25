import { BULAN, judul } from "./data.ts";
import { formatTanggal, hariTerakhir, iso, tambahHari, type Tanggal } from "./kalender.ts";
import type { Makna, Subjek } from "./parser.ts";

// Tahap 3: Translator. Makna hasil parse → rencana query (fungsi SQL + parameter) dan teks SQL-nya.
// Teks SQL di sini SAMA dengan isi fungsi primbon_* di supabase/migrations (PRD 5.4): nilai selalu
// diikat sebagai parameter, tidak pernah digabung ke string SQL.

export type Rpc = "primbon_weton" | "primbon_neptu" | "primbon_jodoh" | "primbon_watak" | "primbon_kapan";
export type Parameter = { nama: string; nilai: string | null; arti: string };
export type Rencana = {
  rpc: Rpc;
  args: Record<string, string | null>;
  sql: string;
  parameter: Parameter[];
  langkah: string[];
  /** Hanya untuk KAPAN: rentang yang diminta user (sisanya dipakai mencari tanggal terdekat). */
  rentang?: { mulai: string; selesai: string; label: string };
};

/** Fungsi bantu di database: hari dan pasaran dari nama ($hari, $pasaran) ATAU dari tanggal ($tanggal). */
export const SQL_WETON_DARI = `CREATE FUNCTION weton_dari(p_hari text, p_pasaran text, p_tanggal date)
RETURNS TABLE (hari text, pasaran text, neptu_hari int, neptu_pasaran int, neptu int) AS $$
  SELECT h.nama, p.nama, h.neptu, p.neptu, h.neptu + p.neptu
  FROM hari h, pasaran p
  WHERE (p_tanggal IS NULL AND h.nama = p_hari AND p.nama = p_pasaran)
     OR (p_tanggal IS NOT NULL
         AND h.urutan = EXTRACT(DOW FROM p_tanggal)
         AND p.urutan = MOD(MOD(p_tanggal - DATE '1945-08-17', 5) + 5, 5));
$$ LANGUAGE sql STABLE;`;

const SQL: Record<Rpc, string> = {
  primbon_weton: `-- R2: apa weton ... tanggal <Tanggal>
SELECT w.hari, w.pasaran, w.neptu_hari, w.neptu_pasaran, w.neptu
FROM weton_dari(NULL, NULL, $1) w;`,
  primbon_neptu: `-- R3: berapa neptu <Subjek>
SELECT w.hari, w.pasaran, w.neptu_hari, w.neptu_pasaran, w.neptu
FROM weton_dari($1, $2, $3) w;`,
  primbon_jodoh: `-- R4: apakah <Subjek> cocok dengan <Subjek>
SELECT a.hari AS hari_1, a.pasaran AS pasaran_1, a.neptu AS neptu_1,
       b.hari AS hari_2, b.pasaran AS pasaran_2, b.neptu AS neptu_2,
       a.neptu + b.neptu AS jumlah, j.sisa, j.nama, j.arti, j.sumber
FROM weton_dari($1, $2, $3) a,
     weton_dari($4, $5, $6) b,
     jodoh j
WHERE j.sisa = MOD(a.neptu + b.neptu, 9);`,
  primbon_watak: `-- R6: bagaimana watak <Subjek>
SELECT w.hari, w.pasaran, w.neptu, k.deskripsi, k.sumber
FROM weton_dari($1, $2, $3) w
JOIN watak k ON k.hari = w.hari AND k.pasaran = w.pasaran;`,
  primbon_kapan: `-- R5: kapan <Weton> <Waktu>
SELECT d::date AS tanggal
FROM generate_series($3::date, $4::date, INTERVAL '1 day') AS d
JOIN hari h    ON h.urutan = EXTRACT(DOW FROM d)
JOIN pasaran p ON p.urutan = MOD(MOD(d::date - DATE '1945-08-17', 5) + 5, 5)
WHERE h.nama = $1 AND p.nama = $2
ORDER BY d;`,
};

const teksSubjek = (s: Subjek) => (s.jenis === "weton" ? `${judul(s.hari)} ${judul(s.pasaran)}` : `lahir ${formatTanggal(s.tanggal)}`);

/** Tiga parameter (hari, pasaran, tanggal) untuk weton_dari; salah satu pasangan dibiarkan NULL. */
function argSubjek(s: Subjek, awal: number, akhiran = "") {
  const args = {
    [`p_hari${akhiran}`]: s.jenis === "weton" ? s.hari : null,
    [`p_pasaran${akhiran}`]: s.jenis === "weton" ? s.pasaran : null,
    [`p_tanggal${akhiran}`]: s.jenis === "tanggal" ? iso(s.tanggal) : null,
  };
  const arti = s.jenis === "weton" ? ["hari", "pasaran", "tanggal (tidak dipakai)"] : ["hari (dihitung dari tanggal)", "pasaran (dihitung dari tanggal)", "tanggal lahir"];
  const parameter = Object.values(args).map((nilai, k) => ({ nama: `$${awal + k}`, nilai, arti: arti[k] }));
  return { args, parameter };
}

export function translate(makna: Makna, hariIni: Tanggal): Rencana {
  switch (makna.jenis) {
    case "WETON": {
      const t = iso(makna.tanggal);
      return {
        rpc: "primbon_weton",
        args: { p_tanggal: t },
        sql: SQL.primbon_weton,
        parameter: [{ nama: "$1", nilai: t, arti: "tanggal lahir" }],
        langkah: [`Tipe WETON → fungsi primbon_weton`, `Tanggal ${formatTanggal(makna.tanggal)} diikat sebagai $1`],
      };
    }
    case "NEPTU":
    case "WATAK": {
      const rpc = makna.jenis === "NEPTU" ? "primbon_neptu" : "primbon_watak";
      const { args, parameter } = argSubjek(makna.subjek, 1);
      return { rpc, args, sql: SQL[rpc], parameter, langkah: [`Tipe ${makna.jenis} → fungsi ${rpc}`, `Subjek: ${teksSubjek(makna.subjek)}`] };
    }
    case "JODOH": {
      const a = argSubjek(makna.kiri, 1, "_1");
      const b = argSubjek(makna.kanan, 4, "_2");
      return {
        rpc: "primbon_jodoh",
        args: { ...a.args, ...b.args },
        sql: SQL.primbon_jodoh,
        parameter: [...a.parameter, ...b.parameter],
        langkah: [`Tipe JODOH → fungsi primbon_jodoh`, `Subjek 1: ${teksSubjek(makna.kiri)}`, `Subjek 2: ${teksSubjek(makna.kanan)}`, `Rumus: (neptu 1 + neptu 2) mod 9`],
      };
    }
    case "KAPAN": {
      // Siklus weton 35 hari. "Berikutnya": cari 35 hari mulai hari ini. "Bulan": lebarkan 35 hari ke
      // kiri dan kanan supaya tanggal terdekat tetap ketemu jika bulan itu tidak memuat weton tersebut.
      const w = makna.waktu;
      const mulaiBulan = w.jenis === "bulan" ? { d: 1, m: w.bulan, y: w.tahun } : hariIni;
      const akhirBulan = w.jenis === "bulan" ? { d: hariTerakhir(w.bulan, w.tahun), m: w.bulan, y: w.tahun } : tambahHari(hariIni, 34);
      const mulai = iso(w.jenis === "bulan" ? tambahHari(mulaiBulan, -35) : mulaiBulan);
      const selesai = iso(w.jenis === "bulan" ? tambahHari(akhirBulan, 35) : akhirBulan);
      const label = w.jenis === "bulan" ? `${judul(BULAN[w.bulan - 1])} ${w.tahun}` : `mulai hari ini (${formatTanggal(hariIni)})`;
      return {
        rpc: "primbon_kapan",
        args: { p_hari: makna.hari, p_pasaran: makna.pasaran, p_mulai: mulai, p_selesai: selesai },
        sql: SQL.primbon_kapan,
        parameter: [
          { nama: "$1", nilai: makna.hari, arti: "hari" },
          { nama: "$2", nilai: makna.pasaran, arti: "pasaran" },
          { nama: "$3", nilai: mulai, arti: "awal pencarian" },
          { nama: "$4", nilai: selesai, arti: "akhir pencarian" },
        ],
        langkah: [`Tipe KAPAN → fungsi primbon_kapan`, `Waktu: ${label}`, `Siklus weton = 7 × 5 = 35 hari, jadi rentang pencarian ${mulai} s.d. ${selesai}`],
        rentang: { mulai: iso(mulaiBulan), selesai: iso(akhirBulan), label },
      };
    }
  }
}
