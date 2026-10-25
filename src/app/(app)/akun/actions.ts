"use server";

import { revalidatePath } from "next/cache";
import { getUser } from "@/lib/auth";

export type ProfileState = { error?: string; field?: "name" | "gender" | "photo"; message?: string };

const PHOTO_TYPES: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp" };
const MAX_PHOTO = 2 * 1024 * 1024;

/** Name, gender, and photo. The photo goes to avatars/<user id>/ (storage RLS only allows the user's own folder). */
export async function saveProfile(_prev: ProfileState, form: FormData): Promise<ProfileState> {
  const { supabase, id, avatarPath, isGuest } = await getUser();
  if (isGuest) return { error: "Akun tamu dipakai bersama, jadi profilnya tidak bisa diubah.", field: "name" };
  const name = String(form.get("name") ?? "").trim();
  const gender = String(form.get("gender") ?? "");
  const photo = form.get("photo");
  const removePhoto = form.get("removePhoto") === "on";

  if (!name || name.length > 100) return { error: "Isi nama (maksimal 100 karakter)", field: "name" };
  if (gender && gender !== "male" && gender !== "female") return { error: "Pilih jenis kelamin", field: "gender" };

  let nextPath = avatarPath;
  if (photo instanceof File && photo.size > 0) {
    const ext = PHOTO_TYPES[photo.type];
    if (!ext) return { error: "Gunakan gambar PNG, JPG, atau WebP", field: "photo" };
    if (photo.size > MAX_PHOTO) return { error: "Ukuran foto maksimal 2 MB", field: "photo" };
    // New file name each time so browsers and CDNs never show the old photo from cache.
    nextPath = `${id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(nextPath, photo, { contentType: photo.type });
    if (error) return { error: `Foto gagal diunggah: ${error.message}`, field: "photo" };
  } else if (removePhoto) {
    nextPath = null;
  }

  const { error } = await supabase.from("profiles").update({ full_name: name, gender: gender || null, avatar_path: nextPath }).eq("id", id);
  if (error) return { error: error.message, field: "name" };
  if (avatarPath && avatarPath !== nextPath) await supabase.storage.from("avatars").remove([avatarPath]);

  revalidatePath("/", "layout");
  return { message: "Profil tersimpan" };
}

export type PasswordState ={ error?: string; field?: "current" | "password" | "confirm"; message?: string };

export async function changePassword(_prev: PasswordState, form: FormData): Promise<PasswordState> {
  const { supabase, email, isGuest } = await getUser();
  if (isGuest) return { error: "Password akun tamu tidak bisa diubah.", field: "current" };
  const current = String(form.get("current") ?? "");
  const password = String(form.get("password") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (!current) return { error: "Isi password saat ini", field: "current" };
  if (password.length < 8) return { error: "Password baru minimal 8 karakter", field: "password" };
  if (password === current) return { error: "Password baru harus berbeda dari yang sekarang", field: "password" };
  if (password !== confirm) return { error: "Ulangi password tidak sama", field: "confirm" };

  // Re-check the current password so an unattended logged-in session cannot change it.
  const { error: authError } = await supabase.auth.signInWithPassword({ email, password: current });
  if (authError) return { error: "Password saat ini salah", field: "current" };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) return { error: `Password gagal diganti: ${error.message}`, field: "password" };
  return { message: "Password berhasil diganti" };
}
