import { after } from "next/server";
import { z } from "zod";
import { AIError, complete, extractJson, QuotaError } from "@/lib/ai";
import type { Balasan, Normalisasi, Sumber } from "@/lib/balasan";
import type { Baris, JalankanRpc } from "@/lib/nlp/evaluator";
import { hariIni as hariIniJakarta } from "@/lib/nlp/kalender";
import { prosesRule, type HasilRule } from "@/lib/nlp/mesin";
import { bacaNormalizer, CONTOH_KALIMAT, promptMbah, promptNormalizer } from "@/lib/nlp/prompt";
import { MAKS_KARAKTER } from "@/lib/nlp/scanner";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// POST /api/tanya (PRD 10): rule-based first; the AI Normalizer only runs after a syntax failure.

export const maxDuration = 60;

const Body = z.object({
  pesan: z.string().trim().min(1).max(MAKS_KARAKTER),
  riwayat: z.array(z.object({ peran: z.enum(["user", "assistant"]), isi: z.string().max(4000) })).max(10).default([]),
  kalimatTerakhir: z.string().max(MAKS_KARAKTER).optional(),
});

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Silakan masuk dulu." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: `Pertanyaan harus 1-${MAKS_KARAKTER} karakter.` }, { status: 400 });

  const { pesan, riwayat, kalimatTerakhir } = parsed.data;
  const userId = auth.user.id;
  const mulai = Date.now();
  const hariIni = hariIniJakarta();
  // RLS applies: the primbon functions run as the logged-in user.
  const jalankan: JalankanRpc = async (rpc, args) => {
    const { data, error } = await supabase.rpc(rpc, args);
    if (error) throw new Error(`${rpc}: ${error.message}`);
    return (data ?? []) as Baris[];
  };

  const log = (sumber: Sumber, extra: { kalimat_baku?: string | null; jenis_kalimat?: string | null; model?: string | null } = {}) =>
    after(async () => {
      const { error } = await createAdminClient()
        .from("query_logs")
        .insert({ user_id: userId, input: pesan, sumber, durasi_ms: Date.now() - mulai, ...extra });
      if (error) console.error("query_logs insert failed", error);
    });
  const balas = (b: Balasan) => Response.json(b);
  const jenisDari = (r: HasilRule) => (r.jejak.parser ? r.jejak.parser.makna.jenis : null);

  try {
    // 1) Rule-based langsung.
    const r = await prosesRule(pesan, jalankan, hariIni);
    if (r.status === "ok") {
      log("rule", { kalimat_baku: r.jejak.scanner.praproses, jenis_kalimat: jenisDari(r) });
      return balas({ sumber: "rule", jawaban: r.jawaban, jejak: r.jejak });
    }
    if (r.status === "gagal_semantik") {
      log("gagal");
      return balas({ sumber: "gagal", pesan: r.pesan, jejak: r.jejak });
    }

    // 2) Gagal sintaks → Normalizer AI (satu kali percobaan).
    let n;
    try {
      n = await complete({ userId, system: promptNormalizer(hariIni, kalimatTerakhir), messages: [{ role: "user", content: pesan }], json: true });
    } catch (e) {
      if (!(e instanceof AIError)) throw e;
      log("gagal");
      const saran = e instanceof QuotaError ? "Coba pakai kalimat baku, Mbah tetap bisa jawab!" : "Pertanyaan dengan kalimat baku tetap bisa dijawab.";
      return balas({ sumber: "gagal", pesan: `${e.message} ${saran}`, contoh: CONTOH_KALIMAT, jejak: r.jejak });
    }
    let hasil;
    try {
      hasil = bacaNormalizer(extractJson(n.text));
    } catch {
      hasil = null;
    }

    if (hasil?.jenis === "primbon") {
      const normalisasi: Normalisasi = { asli: pesan, kalimat: hasil.kalimat, model: n.model };
      const r2 = await prosesRule(hasil.kalimat, jalankan, hariIni);
      if (r2.status === "ok") {
        log("rule_ai", { kalimat_baku: hasil.kalimat, jenis_kalimat: jenisDari(r2), model: n.model });
        return balas({ sumber: "rule_ai", jawaban: r2.jawaban, jejak: r2.jejak, normalisasi });
      }
      log("gagal", { kalimat_baku: hasil.kalimat, model: n.model });
      // Kalimat AI tetap ditolak Parser: AI tidak bisa menyelundupkan jawaban (PRD 2).
      return balas({
        sumber: "gagal",
        pesan: r2.status === "gagal_semantik" ? r2.pesan : "Mbah belum paham maksudnya. Coba tulis seperti contoh di bawah.",
        contoh: CONTOH_KALIMAT,
        jejak: r2.jejak,
        normalisasi,
      });
    }

    if (hasil?.jenis === "tentang_project") {
      const m = await complete({
        userId,
        system: promptMbah(),
        messages: [...riwayat.map((x) => ({ role: x.peran, content: x.isi })), { role: "user" as const, content: pesan }],
      });
      log("mbah", { model: m.model });
      return balas({ sumber: "mbah", teks: m.text, model: m.model });
    }

    log("gagal", { model: n.model });
    return balas({
      sumber: "gagal",
      pesan: hasil ? "Maaf, Mbah cuma paham soal weton dan primbon Jawa, juga cara kerja aplikasi ini." : "Mbah belum paham maksudnya. Coba tulis seperti contoh di bawah.",
      contoh: CONTOH_KALIMAT,
    });
  } catch (e) {
    if (!(e instanceof AIError)) {
      console.error("tanya failed", e);
      return Response.json({ error: "Ada gangguan di server. Coba lagi sebentar lagi." }, { status: 500 });
    }
    log("gagal");
    return balas({ sumber: "gagal", pesan: `${e.message} Pertanyaan dengan kalimat baku tetap bisa dijawab.`, contoh: CONTOH_KALIMAT });
  }
}
