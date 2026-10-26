import { randomUUID } from "node:crypto";
import { after } from "next/server";
import { z } from "zod";
import { AIError, complete, extractJson, pesanUser, QuotaError } from "@/lib/ai";
import type { Balasan, Normalisasi, Sumber } from "@/lib/balasan";
import type { Baris, JalankanRpc } from "@/lib/nlp/evaluator";
import { hariIni as hariIniJakarta } from "@/lib/nlp/kalender";
import { prosesRule, type HasilRule } from "@/lib/nlp/mesin";
import { bacaNormalizer, CONTOH_KALIMAT, promptMbah, promptNormalizer } from "@/lib/nlp/prompt";
import { MAKS_KARAKTER } from "@/lib/nlp/scanner";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// POST /api/tanya (PRD 10): rule-based first; the AI Normalizer only runs after a syntax failure or when an
// image is attached. Conversations are saved per account, except for the shared guest account.

export const maxDuration = 120;

const JENIS_GAMBAR: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
// The browser shrinks photos to ~1280 px before sending, so 3 MB of base64 is plenty.
const MAKS_GAMBAR = 3_000_000;

const Body = z
  .object({
    pesan: z.string().trim().max(MAKS_KARAKTER).default(""),
    gambar: z
      .string()
      .max(MAKS_GAMBAR)
      .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)
      .optional(),
    percakapanId: z.uuid().optional(),
    riwayat: z.array(z.object({ peran: z.enum(["user", "assistant"]), isi: z.string().max(6000) })).max(20).default([]),
    kalimatTerakhir: z.string().max(MAKS_KARAKTER).optional(),
  })
  .refine((b) => b.pesan || b.gambar, "Pesan atau gambar wajib ada");

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return Response.json({ error: "Silakan masuk dulu." }, { status: 401 });
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: `Tulis pertanyaan (maksimal ${MAKS_KARAKTER} karakter) atau lampirkan gambar PNG, JPG, atau WebP.` }, { status: 400 });

  const { pesan, gambar, riwayat, kalimatTerakhir } = parsed.data;
  const userId = auth.user.id;
  const mulai = Date.now();
  const hariIni = hariIniJakarta();
  // RLS applies: the primbon functions run as the logged-in user.
  const jalankan: JalankanRpc = async (rpc, args) => {
    const { data, error } = await supabase.rpc(rpc, args);
    if (error) throw new Error(`${rpc}: ${error.message}`);
    return (data ?? []) as Baris[];
  };

  // Save the user's message first, so it survives even if the answer fails. Saving problems never break the chat.
  const { data: profil } = await supabase.from("profiles").select("role").eq("id", userId).single();
  const simpanRiwayat = profil?.role !== "guest";
  let percakapanId = simpanRiwayat ? parsed.data.percakapanId : undefined;
  if (simpanRiwayat) {
    try {
      percakapanId = await simpanPesanUser(supabase, userId, percakapanId, pesan, gambar);
    } catch (e) {
      console.error("saving user message failed", e);
    }
  }

  const log = (sumber: Sumber, extra: { kalimat_baku?: string | null; jenis_kalimat?: string | null; model?: string | null } = {}) =>
    after(async () => {
      const { error } = await createAdminClient()
        .from("query_logs")
        .insert({ user_id: userId, input: pesan || "[gambar]", sumber, durasi_ms: Date.now() - mulai, ...extra });
      if (error) console.error("query_logs insert failed", error);
    });
  const balas = async (b: Balasan) => {
    if (percakapanId) {
      const { error } = await supabase.from("pesan").insert({ percakapan_id: percakapanId, peran: "mbah", balasan: b });
      if (error) console.error("saving answer failed", error);
    }
    return Response.json({ ...b, percakapanId });
  };
  const jenisDari = (r: HasilRule) => (r.jejak.parser ? r.jejak.parser.makna.jenis : null);

  try {
    // 1) Rule-based langsung (hanya teks; gambar selalu dibaca AI dulu).
    const r = gambar ? null : await prosesRule(pesan, jalankan, hariIni);
    if (r?.status === "ok") {
      log("rule", { kalimat_baku: r.jejak.scanner.praproses, jenis_kalimat: jenisDari(r) });
      return balas({ sumber: "rule", jawaban: r.jawaban, jejak: r.jejak });
    }
    if (r?.status === "gagal_semantik") {
      log("gagal");
      return balas({ sumber: "gagal", pesan: r.pesan, jejak: r.jejak, galatParser: r.pesan });
    }

    // 2) Gagal sintaks atau ada gambar → Normalizer AI (satu kali percobaan). Dengan gambar, AI bisa membaca
    // tanggal lahir dari foto (misalnya akta), tetapi hitungannya tetap rule-based.
    let n;
    try {
      n = await complete({ userId, system: promptNormalizer(hariIni, kalimatTerakhir, riwayat), messages: [pesanUser(pesan, gambar)], json: true });
    } catch (e) {
      if (!(e instanceof AIError)) throw e;
      log("gagal");
      const saran = e instanceof QuotaError ? "Coba pakai kalimat baku, Mbah tetap bisa jawab!" : "Pertanyaan dengan kalimat baku tetap bisa dijawab.";
      return balas({ sumber: "gagal", pesan: `${e.message} ${saran}`, contoh: CONTOH_KALIMAT, ...(r && { jejak: r.jejak, galatParser: r.pesan }) });
    }
    let hasil;
    try {
      hasil = bacaNormalizer(extractJson(n.text));
    } catch {
      hasil = null;
    }

    if (hasil?.jenis === "primbon") {
      const normalisasi: Normalisasi = { asli: pesan || "(dari gambar)", kalimat: hasil.kalimat };
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
        galatParser: r2.pesan,
        normalisasi,
      });
    }

    // 3) Everything else (greetings, follow-ups, curhat, general questions, images, or an unreadable
    // classification) goes to Mbah instead of a canned refusal (PRD 6.2).
    const m = await complete({
      userId,
      system: promptMbah(hariIni),
      messages: [...riwayat.map((x) => ({ role: x.peran, content: x.isi })), pesanUser(pesan, gambar)],
    });
    log("mbah", { model: m.model });
    return balas({ sumber: "mbah", teks: m.text });
  } catch (e) {
    if (!(e instanceof AIError)) {
      console.error("tanya failed", e);
      return Response.json({ error: "Ada gangguan di server. Coba lagi sebentar lagi.", percakapanId }, { status: 500 });
    }
    log("gagal");
    return balas({ sumber: "gagal", pesan: `${e.message} Pertanyaan dengan kalimat baku tetap bisa dijawab.`, contoh: CONTOH_KALIMAT });
  }
}

type Supa = Awaited<ReturnType<typeof createClient>>;

/** Creates the conversation on the first message (titled from the text), uploads the image, and stores the message. */
async function simpanPesanUser(supabase: Supa, userId: string, percakapanId: string | undefined, pesan: string, gambar: string | undefined) {
  let id = percakapanId;
  if (id) {
    const { data } = await supabase.from("percakapan").select("id").eq("id", id).maybeSingle();
    if (!data) id = undefined; // deleted or not ours: start a fresh one
  }
  if (!id) {
    const judul = (pesan || "Kiriman gambar").replace(/\s+/g, " ").slice(0, 60);
    const { data, error } = await supabase.from("percakapan").insert({ judul }).select("id").single();
    if (error) throw error;
    id = data.id as string;
  }

  let gambarPath: string | null = null;
  if (gambar) {
    const [, tipe, isi] = gambar.match(/^data:(image\/[a-z]+);base64,(.+)$/)!;
    gambarPath = `${userId}/${id}/${randomUUID()}.${JENIS_GAMBAR[tipe]}`;
    const { error } = await supabase.storage.from("chat-gambar").upload(gambarPath, Buffer.from(isi, "base64"), { contentType: tipe });
    if (error) {
      console.error("image upload failed", error);
      gambarPath = null;
    }
  }

  const { error } = await supabase.from("pesan").insert({ percakapan_id: id, peran: "user", teks: pesan || null, gambar_path: gambarPath });
  if (error) throw error;
  return id;
}
