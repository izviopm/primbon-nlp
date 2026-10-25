"use server";

import { revalidatePath } from "next/cache";
import { AIError, complete, listModels } from "@/lib/ai";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export type AdminState = { error?: string; message?: string };

function done(message: string): AdminState {
  revalidatePath("/admin");
  return { message };
}

const intOrNull = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "").trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isInteger(n) && n >= 0 ? n : NaN;
};

export async function createUser(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const name = String(form.get("name") ?? "").trim();
  const gender = String(form.get("gender") ?? "");
  const role = String(form.get("role") ?? "user");
  const email = String(form.get("email") ?? "").trim();
  const password = String(form.get("password") ?? "");
  if (!name || name.length > 100) return { error: "Isi nama (maksimal 100 karakter)" };
  if (gender && gender !== "male" && gender !== "female") return { error: "Pilih jenis kelamin" };
  if (role !== "user" && role !== "admin") return { error: "Peran tidak dikenal" };
  if (!/^\S+@\S+\.\S+$/.test(email)) return { error: "Email tidak valid" };
  if (password.length < 8) return { error: "Password minimal 8 karakter" };
  const db = createAdminClient();
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) return { error: error.message };
  // The profile row is created by the auth trigger; fill in the details the admin entered.
  const { error: e2 } = await db.from("profiles").update({ full_name: name, gender: gender || null, role }).eq("id", data.user.id);
  if (e2) return { error: `Akun dibuat, tetapi profil gagal disimpan: ${e2.message}` };
  return done(`Akun ${name} (${email}) dibuat`);
}

/** Admin sets a new temporary password for a user who forgot theirs. */
export async function resetUserPassword(_p: AdminState, form: FormData): Promise<AdminState> {
  await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const password = String(form.get("password") ?? "");
  if (!userId) return { error: "User tidak dikenal" };
  if (password.length < 8) return { error: "Password baru minimal 8 karakter" };
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("role").eq("id", userId).single();
  // The guest password lives in GUEST_PASSWORD; changing it here would lock every visitor out.
  if (p?.role === "guest") return { error: "Password akun tamu diatur lewat environment variable GUEST_PASSWORD." };
  const { error } = await db.auth.admin.updateUserById(userId, { password });
  if (error) return { error: error.message };
  return done("Password direset. Bagikan ke user lewat jalur yang aman.");
}

export async function setRole(_p: AdminState, form: FormData): Promise<AdminState> {
  const me = await requireAdmin();
  const userId = String(form.get("userId") ?? "");
  const role = String(form.get("role") ?? "");
  if (role !== "user" && role !== "admin") return { error: "Peran tidak dikenal" };
  if (userId === me.id) return { error: "Kamu tidak bisa mengubah peranmu sendiri." };
  const db = createAdminClient();
  const { data: p } = await db.from("profiles").select("role").eq("id", userId).single();
  if (p?.role === "guest") return { error: "Peran akun tamu tidak bisa diubah." };
  const { error } = await db.from("profiles").update({ role }).eq("id", userId);
  if (error) return { error: error.message };
  return done("Peran disimpan");
}

type Model = { id: string; name: string };

export async function saveAiSettings(_p: AdminState, form: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const baseUrl = String(form.get("baseUrl") ?? "").trim();
  const key = String(form.get("apiKey") ?? "").trim();
  const main = String(form.get("main") ?? "").trim();
  let models: Model[];
  try {
    models = JSON.parse(String(form.get("models") ?? "[]"));
  } catch {
    return { error: "Daftar model tidak valid" };
  }
  if (!/^https?:\/\/\S+$/.test(baseUrl)) return { error: "Isi Base URL, misalnya https://openrouter.ai/api/v1" };
  if (!models.length) return { error: "Tambahkan minimal satu model" };
  if (new Set(models.map((m) => m.id)).size !== models.length) return { error: "Ada ID model yang sama" };
  if (!models.some((m) => m.id === main)) return { error: "Pilih model utama dari daftar" };

  if (key) {
    const { error } = await supabase.rpc("set_ai_api_key", { p_key: key });
    if (error) return { error: `API key gagal disimpan: ${error.message}` };
  }
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("ai_settings").update({ base_url: baseUrl, model: main, updated_at: new Date().toISOString() }).eq("id", true),
    supabase.from("app_settings").upsert({ key: "ai_models", value: { models } }),
  ]);
  if (e1 || e2) return { error: (e1 ?? e2)!.message };
  return done("Pengaturan AI tersimpan");
}

/** "Ambil daftar model": uses the key typed in the form, or the stored one. */
export async function fetchModels(baseUrl: string, typedKey: string): Promise<{ models?: string[]; error?: string }> {
  await requireAdmin();
  if (!/^https?:\/\/\S+$/.test(baseUrl.trim())) return { error: "Isi Base URL dulu" };
  let key = typedKey.trim();
  if (!key) {
    const { data } = await createAdminClient().rpc("get_ai_api_key");
    key = (data as string | null) ?? "";
  }
  if (!key) return { error: "Isi API key dulu" };
  try {
    return { models: await listModels(baseUrl.trim(), key) };
  } catch (e) {
    return { error: (e as Error).message };
  }
}

export async function testConnection(): Promise<{ message?: string; error?: string }> {
  const { id } = await requireAdmin();
  try {
    const r = await complete({ userId: id, system: "Jawab dengan satu kata saja.", messages: [{ role: "user", content: "Ucapkan: siap" }] });
    return { message: `Tersambung lewat ${r.model}: "${r.text.trim().slice(0, 60)}"` };
  } catch (e) {
    return { error: e instanceof AIError ? e.message : `Gagal: ${(e as Error).message}` };
  }
}

export async function saveLimits(_p: AdminState, form: FormData): Promise<AdminState> {
  const { supabase } = await requireAdmin();
  const perUser = intOrNull(form.get("perUser"));
  const guest = intOrNull(form.get("guest"));
  const global = intOrNull(form.get("global"));
  if ([perUser, guest, global].some((n) => Number.isNaN(n))) return { error: "Limit harus bilangan bulat 0 atau lebih (kosongkan untuk tanpa batas)" };
  const { error } = await supabase.from("app_settings").upsert({
    key: "limits",
    value: { per_user_per_day: perUser, guest_per_day: guest, global_per_day: global, ai_enabled: form.get("aiEnabled") === "on" },
  });
  if (error) return { error: error.message };
  return done("Limit tersimpan");
}
