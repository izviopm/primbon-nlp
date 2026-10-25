import type { Jawaban } from "./nlp/evaluator.ts";
import type { Jejak } from "./nlp/mesin.ts";

// Bentuk respons POST /api/tanya (PRD 10), dipakai server dan UI chat.

export type Sumber = "rule" | "rule_ai" | "mbah" | "gagal";
export type Normalisasi = { asli: string; kalimat: string; model: string };

export type Balasan =
  | { sumber: "rule"; jawaban: Jawaban; jejak: Jejak }
  | { sumber: "rule_ai"; jawaban: Jawaban; jejak: Jejak; normalisasi: Normalisasi }
  | { sumber: "mbah"; teks: string; model: string }
  | { sumber: "gagal"; pesan: string; contoh?: string[]; jejak?: Jejak; normalisasi?: Normalisasi };

export type PesanRiwayat = { peran: "user" | "assistant"; isi: string };
