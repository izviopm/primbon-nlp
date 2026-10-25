// Creates (or repairs) the shared guest account from GUEST_EMAIL / GUEST_PASSWORD (PRD 7).
// Run once: npm run setup:guest
import { createClient } from "@supabase/supabase-js";

const { NEXT_PUBLIC_SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: key, GUEST_EMAIL: email, GUEST_PASSWORD: password } = process.env;
if (!url || !key || !email || !password) throw new Error("Isi NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GUEST_EMAIL, dan GUEST_PASSWORD di .env.local");
if (password.length < 12) throw new Error("GUEST_PASSWORD minimal 12 karakter; user tidak pernah mengetiknya (mereka memakai alias tamu/tamu).");

const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const { data: list, error: e1 } = await db.auth.admin.listUsers({ perPage: 1000 });
if (e1) throw e1;
let user = list.users.find((u) => u.email === email);
if (user) {
  const { error } = await db.auth.admin.updateUserById(user.id, { password });
  if (error) throw error;
} else {
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  user = data.user;
}
const { error: e2 } = await db.from("profiles").update({ role: "guest", full_name: "Tamu" }).eq("id", user.id);
if (e2) throw e2;
console.log(`Akun tamu siap: ${email} (role guest). Login di aplikasi dengan tamu / tamu.`);
