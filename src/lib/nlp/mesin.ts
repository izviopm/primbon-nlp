import { evaluate, type Baris, type JalankanRpc, type Jawaban } from "./evaluator.ts";
import type { Tanggal } from "./kalender.ts";
import { GagalSemantik, GagalSintaks, parse, type Makna, type Simpul } from "./parser.ts";
import { scan, type HasilScan } from "./scanner.ts";
import { translate, type Rencana } from "./translator.ts";

// Merangkai empat tahap. Jejak setiap tahap dikembalikan untuk panel tahapan di UI.

export type Jejak = {
  scanner: HasilScan;
  parser?: { pohon: Simpul; aturan: string[]; makna: Makna };
  translator?: Rencana;
  evaluator?: { langkah: string[]; baris: Baris[] };
};

export type HasilRule =
  | { status: "ok"; jawaban: Jawaban; jejak: Jejak }
  | { status: "gagal_sintaks"; pesan: string; posisi: number; jejak: Jejak }
  | { status: "gagal_semantik"; pesan: string; jejak: Jejak };

export async function prosesRule(kalimat: string, jalankan: JalankanRpc, hariIni: Tanggal): Promise<HasilRule> {
  const jejak: Jejak = { scanner: scan(kalimat) };
  let hasil;
  try {
    hasil = parse(jejak.scanner.token);
  } catch (e) {
    if (e instanceof GagalSintaks) return { status: "gagal_sintaks", pesan: e.message, posisi: e.posisi, jejak };
    if (e instanceof GagalSemantik) return { status: "gagal_semantik", pesan: e.message, jejak };
    throw e;
  }
  jejak.parser = { pohon: hasil.pohon, aturan: hasil.aturan, makna: hasil.makna };
  jejak.translator = translate(hasil.makna, hariIni);
  const ev = await evaluate(hasil.makna, jejak.translator, jalankan, hariIni);
  jejak.evaluator = { langkah: ev.langkah, baris: ev.baris };
  return { status: "ok", jawaban: ev.jawaban, jejak };
}
