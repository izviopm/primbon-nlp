"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type LoginState = { error?: string; field?: "email" | "password" };

const GUEST_ALIAS = "tamu";

/** Email + password, or the shared guest alias "tamu"/"tamu" which maps to the real guest account (PRD 7). */
export async function signIn(_prev: LoginState, form: FormData): Promise<LoginState> {
  const asGuest = form.get("guest") === "1";
  let email = String(form.get("email") ?? "").trim();
  let password = String(form.get("password") ?? "");

  if (!asGuest) {
    if (!email) return { error: "Isi email atau username", field: "email" };
    if (!password) return { error: "Isi password", field: "password" };
  }
  if (asGuest || (email.toLowerCase() === GUEST_ALIAS && password === GUEST_ALIAS)) {
    email = process.env.GUEST_EMAIL ?? "";
    password = process.env.GUEST_PASSWORD ?? "";
    if (!email || !password) return { error: "Akun tamu belum disiapkan admin.", field: "password" };
  } else if (!email.includes("@")) {
    return { error: "Username yang dikenal hanya \"tamu\". Selain itu, masuk dengan email.", field: "email" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    // Only bad credentials should read as "wrong password"; config/network failures must stay visible.
    if (error.code === "invalid_credentials") return { error: asGuest ? "Akun tamu sedang bermasalah. Hubungi admin." : "Email atau password salah", field: "password" };
    console.error("signIn failed", error);
    return { error: "Belum bisa masuk sekarang. Coba lagi sebentar lagi.", field: "password" };
  }
  redirect("/");
}
