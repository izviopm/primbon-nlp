import "server-only";
import { AllFailedError, firstSuccess } from "@/lib/fallback";
import { createAdminClient } from "@/lib/supabase/server";

// OpenAI-compatible client with main + backup models (PRD 6.3). Adapted from Goukaku's lib/ai.ts.

export type ChatMessage = { role: "user" | "assistant"; content: string };
type CallOptions = { system: string; messages: ChatMessage[]; json?: boolean; userId: string };

const LIMIT_MESSAGES: Record<string, string> = {
  AI_DISABLED: "AI sedang dimatikan oleh admin.",
  GLOBAL_LIMIT: "Batas harian AI untuk semua pengguna sudah tercapai. Coba lagi besok.",
  GUEST_LIMIT: "Kuota AI tamu hari ini sudah habis.",
  USER_LIMIT: "Kuota AI harianmu sudah habis.",
};

export class AIError extends Error {}
/** Limit or kill switch hit: trying another model would not help. */
export class QuotaError extends AIError {}
export class ProviderError extends AIError {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

// Every model shares one key, so a key/permission error or a quota stop fails them all.
export const isFatal = (e: unknown) => e instanceof QuotaError || (e instanceof ProviderError && (e.status === 401 || e.status === 403));

const TIMEOUT_MS = 45_000;

/** Checks the kill switch and limits, then records one AI call. Throws QuotaError with a user-facing message. */
async function consumeQuota(userId: string) {
  const { error } = await createAdminClient().rpc("consume_ai_quota", { p_user_id: userId });
  if (error) {
    const code = Object.keys(LIMIT_MESSAGES).find((k) => error.message.includes(k));
    throw new QuotaError(code ? LIMIT_MESSAGES[code] : `Tidak bisa mengecek kuota AI: ${error.message}`);
  }
}

type Config = { baseUrl: string; apiKey: string; order: string[] };

async function getConfig(): Promise<Config> {
  const db = createAdminClient();
  const [{ data: s }, { data: key }, { data: list }] = await Promise.all([
    db.from("ai_settings").select("model, base_url").eq("id", true).maybeSingle(),
    db.rpc("get_ai_api_key"),
    db.from("app_settings").select("value").eq("key", "ai_models").maybeSingle(),
  ]);
  if (!s?.model || !s.base_url || !key) throw new AIError("AI belum diatur. Minta admin mengisi Base URL, API key, dan model.");
  const backups = ((list?.value?.models as { id: string }[]) ?? []).map((m) => m.id).filter((id) => id !== s.model);
  return { baseUrl: s.base_url, apiKey: key as string, order: [s.model, ...backups] };
}

/** One completion: main model first, then backups in the admin's order. Quota is charged only once AI is configured. */
export async function complete(opts: CallOptions): Promise<{ text: string; model: string }> {
  const cfg = await getConfig();
  await consumeQuota(opts.userId);
  try {
    const { model, value, failed } = await firstSuccess(cfg.order, (m) => request(cfg, m, opts), isFatal);
    if (failed.length) console.warn(`AI fallback: dijawab ${model} setelah`, failed);
    return { text: value, model };
  } catch (e) {
    if (!(e instanceof AllFailedError)) throw e;
    throw new AIError(`Semua model AI sedang tidak tersedia (${e.message}).`);
  }
}

async function request(cfg: Config, model: string, { system, messages, json }: CallOptions): Promise<string> {
  const res = await fetch(`${cfg.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
    method: "POST",
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { authorization: `Bearer ${cfg.apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model,
      temperature: json ? 0 : 0.6,
      messages: [{ role: "system", content: system }, ...messages],
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ProviderError(res.status, `Provider AI menolak permintaan (${res.status}): ${body?.error?.message ?? "tanpa detail"}`);
  const text = body.choices?.[0]?.message?.content ?? "";
  if (!String(text).trim()) throw new AIError("Balasan kosong");
  return text;
}

/** Lists model ids from GET {baseUrl}/models (admin "Ambil daftar model"). */
export async function listModels(baseUrl: string, apiKey: string): Promise<string[]> {
  const res = await fetch(`${baseUrl.replace(/\/+$/, "")}/models`, {
    headers: { authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(15_000),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new ProviderError(res.status, `Gagal mengambil daftar model (${res.status}): ${body?.error?.message ?? "tanpa detail"}`);
  return ((body.data ?? []) as { id: string }[]).map((m) => m.id).sort();
}

/** Pulls the first JSON object out of a model reply (models often wrap JSON in prose or fences). */
export function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const raw = fenced ? fenced[1] : text;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end < start) throw new AIError("Balasan AI tidak berisi JSON.");
  return JSON.parse(raw.slice(start, end + 1)) as T;
}
