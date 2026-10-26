import type { Jawaban } from "./nlp/evaluator.ts";
import type { Jejak } from "./nlp/mesin.ts";

// Bentuk respons POST /api/tanya (PRD 10), dipakai server dan UI chat.

export type Sumber = "rule" | "rule_ai" | "mbah" | "gagal";
// The AI model name is deliberately left out of responses; it is only stored in query_logs for the admin.
export type Normalisasi = { asli: string; kalimat: string };

export type Balasan =
  | { sumber: "rule"; jawaban: Jawaban; jejak: Jejak }
  | { sumber: "rule_ai"; jawaban: Jawaban; jejak: Jejak; normalisasi: Normalisasi }
  | { sumber: "mbah"; teks: string }
  | { sumber: "gagal"; pesan: string; contoh?: string[]; jejak?: Jejak; normalisasi?: Normalisasi; galatParser?: string };
// galatParser: why the Parser rejected the sentence, shown in the stage panel (pesan may be about AI or quota).

export type PesanRiwayat = { peran: "user" | "assistant"; isi: string };
