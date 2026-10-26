import { ISTILAH, judul } from "./data.ts";
import { banding, dariIso, formatTanggal, iso, type Tanggal } from "./kalender.ts";
import type { Makna } from "./parser.ts";
import type { Rencana, Rpc } from "./translator.ts";

// Tahap 4: Evaluator. Menjalankan fungsi SQL dari Translator, lalu menyusun jawaban, cara hitungnya,
// dan rincian primbon yang dijelaskan dengan bahasa awam (PRD 5.5).

export type Baris = Record<string, string | number | null>;
/** Pemanggil fungsi SQL. Di server: supabase.rpc. Di unit test: database tiruan (db-memori.ts). */
export type JalankanRpc = (rpc: Rpc, args: Record<string, string | null>) => Promise<Baris[]>;
export type Rincian = { judul: string; isi: string; label?: string };
export type Jawaban = { judul: string; isi: string; rumus?: string; rincian?: Rincian[]; istilah?: { kata: string; arti: string }[]; catatan?: string };
export type HasilEvaluasi = { jawaban: Jawaban; baris: Baris[]; langkah: string[] };

export const DISCLAIMER = "Primbon adalah warisan budaya, bukan ramalan pasti.";

const w = (h: unknown, p: unknown) => `${judul(String(h))} ${judul(String(p))}`;
const istilah = (...kata: string[]) => kata.map((k) => ({ kata: judul(k), arti: ISTILAH[k] }));

/** Kartu weton dari satu baris primbon_profil: watak hari, pasaran, weton, dan wuku (jika ada tanggal). */
function rincianProfil(r: Baris): Rincian[] {
  const out: Rincian[] = [
    { label: "Hari lahir", judul: judul(String(r.hari)), isi: String(r.watak_hari) },
    { label: "Pasaran", judul: judul(String(r.pasaran)), isi: String(r.watak_pasaran) },
    { label: "Weton (gabungan)", judul: w(r.hari, r.pasaran), isi: String(r.watak_weton) },
  ];
  if (r.wuku) out.push({ label: `Wuku ke-${r.wuku_ke} dari 30`, judul: `${r.wuku} · dewa pelindung ${r.dewa_wuku}`, isi: String(r.watak_wuku) });
  return out;
}

function catatanProfil(r: Baris) {
  const sumber = [`Watak hari dan pasaran: ${r.sumber_hari_pasaran}`, `Watak weton: ${r.sumber_weton}`, r.wuku ? `Wuku: ${r.sumber_wuku}` : null].filter(Boolean).join(" ");
  return `${DISCLAIMER} ${sumber}`;
}

export async function evaluate(makna: Makna, rencana: Rencana, jalankan: JalankanRpc, hariIni: Tanggal): Promise<HasilEvaluasi> {
  const baris = await jalankan(rencana.rpc, rencana.args);
  const langkah = [`Menjalankan ${rencana.rpc} → ${baris.length} baris`];
  if (!baris.length && makna.jenis !== "KAPAN") throw new Error(`${rencana.rpc} tidak mengembalikan data. Cek isi tabel primbon.`);
  const r = baris[0];

  switch (makna.jenis) {
    case "WETON": {
      langkah.push(
        `Hari dari kalender Masehi: ${judul(String(r.hari))}`,
        `Pasaran dari selisih hari terhadap 17 Agustus 1945 (Jumat Legi), mod 5: ${judul(String(r.pasaran))}`,
        `Wuku dari selisih hari terhadap 17 Desember 2000 (awal Sinta), mod 210, dibagi 7: ${r.wuku}`,
      );
      return {
        baris,
        langkah,
        jawaban: {
          judul: w(r.hari, r.pasaran),
          isi: `Orang yang lahir ${formatTanggal(makna.tanggal)} memiliki weton ${w(r.hari, r.pasaran)} dengan neptu ${r.neptu}, dan lahir di wuku ${r.wuku}.`,
          rumus: `Neptu: ${judul(String(r.hari))} (${r.neptu_hari}) + ${judul(String(r.pasaran))} (${r.neptu_pasaran}) = ${r.neptu}`,
          rincian: rincianProfil(r),
          istilah: istilah("weton", "neptu", "wuku"),
          catatan: catatanProfil(r),
        },
      };
    }
    case "NEPTU": {
      langkah.push(`neptu = neptu hari + neptu pasaran = ${r.neptu_hari} + ${r.neptu_pasaran}`);
      const dari = makna.subjek.jenis === "tanggal" ? ` (lahir ${formatTanggal(makna.subjek.tanggal)})` : "";
      return {
        baris,
        langkah,
        jawaban: {
          judul: `Neptu ${r.neptu}`,
          isi: `Weton ${w(r.hari, r.pasaran)}${dari} memiliki neptu ${r.neptu}. Angka ini dipakai untuk menghitung kecocokan jodoh: jumlahkan dengan neptu pasangan, lalu sisa baginya dengan 9 menunjukkan kategorinya.`,
          rumus: `${judul(String(r.hari))} (${r.neptu_hari}) + ${judul(String(r.pasaran))} (${r.neptu_pasaran}) = ${r.neptu}`,
          istilah: istilah("neptu", "pasaran"),
        },
      };
    }
    case "JODOH": {
      const rumus = `${w(r.hari_1, r.pasaran_1)} (${r.neptu_1}) + ${w(r.hari_2, r.pasaran_2)} (${r.neptu_2}) = ${r.jumlah} → ${r.jumlah} mod 9 = ${r.sisa} → ${r.nama}`;
      langkah.push(`Jumlah neptu ${r.jumlah}, sisa bagi 9 = ${r.sisa}`, `Tabel jodoh sisa ${r.sisa} = ${r.nama}`);
      return {
        baris,
        langkah,
        jawaban: {
          judul: String(r.nama),
          isi: String(r.arti),
          rumus,
          rincian: [
            { label: "Cara membaca", judul: "Jumlah neptu, lalu sisa bagi 9", isi: `Neptu kedua weton dijumlahkan (${r.jumlah}), lalu dibagi 9. Sisanya (${r.sisa}) dicocokkan ke delapan kategori: Pegat, Ratu, Jodoh, Topo, Tinari, Padu, Sujanan, dan Pesthi.` },
            { label: "Saran", judul: "Anggap sebagai pengingat", isi: "Hasil yang kurang baik bukan larangan. Dalam tradisi Jawa, hasil seperti ini biasanya dibaca sebagai pengingat untuk lebih saling memahami." },
          ],
          istilah: istilah("weton", "neptu"),
          catatan: `${DISCLAIMER} Sumber: ${r.sumber}`,
        },
      };
    }
    case "WATAK": {
      langkah.push(`Watak hari, pasaran, dan weton diambil dari tabel hari, pasaran, dan watak untuk ${w(r.hari, r.pasaran)}`, r.wuku ? `Wuku ${r.wuku} dihitung dari tanggal lahir` : "Wuku dilewati karena tanggal lahir tidak disebut");
      return {
        baris,
        langkah,
        jawaban: {
          judul: `Watak ${w(r.hari, r.pasaran)}`,
          isi: String(r.watak_weton),
          rumus: `Neptu ${w(r.hari, r.pasaran)} = ${r.neptu}`,
          rincian: rincianProfil(r),
          istilah: istilah("weton", "pasaran", ...(r.wuku ? ["wuku"] : [])),
          catatan: r.wuku ? catatanProfil(r) : `${catatanProfil(r)} Sebutkan tanggal lahir agar wuku ikut dihitung.`,
        },
      };
    }
    case "KAPAN": {
      const nama = w(makna.hari, makna.pasaran);
      const tanggal = baris.map((b) => dariIso(String(b.tanggal)));
      const { mulai, selesai, label } = rencana.rentang!;
      const di = tanggal.filter((t) => banding(t, dariIso(mulai)) >= 0 && banding(t, dariIso(selesai)) <= 0);
      if (makna.waktu.jenis === "berikutnya") {
        const t = di[0];
        if (!t) throw new Error("primbon_kapan tidak menemukan tanggal dalam 35 hari, padahal siklusnya 35 hari.");
        const lagi = Math.round(banding(t, hariIni) / 86_400_000);
        langkah.push(`Tanggal pertama yang cocok: ${iso(t)}`);
        return {
          baris,
          langkah,
          jawaban: {
            judul: lagi === 0 ? "Hari ini!" : formatTanggal(t),
            isi: lagi === 0 ? `Hari ini (${formatTanggal(t)}) adalah ${nama}.` : `${nama} berikutnya jatuh pada ${formatTanggal(t)}, ${lagi} hari lagi. Setelah itu berulang setiap 35 hari.`,
            rumus: `Dicari dari ${formatTanggal(hariIni)}, siklus weton 35 hari`,
            istilah: istilah("weton"),
          },
        };
      }
      if (di.length) {
        langkah.push(`Tanggal di ${label}: ${di.map(iso).join(", ")}`);
        return { baris, langkah, jawaban: { judul: di.map(formatTanggal).join(" dan "), isi: `${nama} di ${label} jatuh pada ${di.map(formatTanggal).join(" dan ")}.`, istilah: istilah("weton") } };
      }
      // Bulan ini tidak memuat weton itu: tampilkan tanggal terdekat sebelum dan sesudahnya.
      const sebelum = tanggal.filter((t) => banding(t, dariIso(mulai)) < 0).at(-1);
      const sesudah = tanggal.find((t) => banding(t, dariIso(selesai)) > 0);
      langkah.push(`Tidak ada ${nama} di ${label}; tanggal terdekat: ${[sebelum, sesudah].filter(Boolean).map((t) => iso(t!)).join(" dan ")}`);
      return {
        baris,
        langkah,
        jawaban: {
          judul: `Tidak ada di ${label}`,
          isi: `${nama} tidak jatuh di ${label}. Terdekat: ${[sebelum && `sebelumnya ${formatTanggal(sebelum)}`, sesudah && `sesudahnya ${formatTanggal(sesudah)}`].filter(Boolean).join(", ")}.`,
          rumus: "Siklus weton 35 hari lebih panjang dari sebulan, jadi ada bulan yang tidak memuat weton tertentu",
        },
      };
    }
  }
}
