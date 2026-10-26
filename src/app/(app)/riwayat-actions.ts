"use server";

import { getUser } from "@/lib/auth";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Deletes one of the user's conversations, its messages (cascade), and its images in storage. */
export async function hapusPercakapan(id: string): Promise<{ error?: string }> {
  const { supabase, id: userId, isGuest } = await getUser();
  if (isGuest) return { error: "Akun tamu tidak menyimpan riwayat." };
  if (!UUID.test(id)) return { error: "Percakapan tidak dikenal." };
  const folder = `${userId}/${id}`;
  const { data: berkas } = await supabase.storage.from("chat-gambar").list(folder, { limit: 1000 });
  if (berkas?.length) {
    const { error } = await supabase.storage.from("chat-gambar").remove(berkas.map((b) => `${folder}/${b.name}`));
    if (error) console.error("removing chat images failed", error);
  }
  // RLS limits the delete to the user's own rows.
  const { error } = await supabase.from("percakapan").delete().eq("id", id);
  return error ? { error: "Percakapan gagal dihapus. Coba lagi." } : {};
}

/** Renames one of the user's conversations. Does not touch updated_at, so the list order stays put. */
export async function gantiJudulPercakapan(id: string, judul: string): Promise<{ error?: string; judul?: string }> {
  const { supabase, isGuest } = await getUser();
  if (isGuest) return { error: "Akun tamu tidak menyimpan riwayat." };
  if (!UUID.test(id)) return { error: "Percakapan tidak dikenal." };
  const bersih = judul.replace(/\s+/g, " ").trim();
  if (!bersih) return { error: "Judul tidak boleh kosong." };
  if (bersih.length > 120) return { error: "Judul maksimal 120 karakter." };
  // RLS limits the update to the user's own rows; no row back means it is not theirs or is gone.
  const { data, error } = await supabase.from("percakapan").update({ judul: bersih }).eq("id", id).select("judul").maybeSingle();
  if (error || !data) return { error: "Judul gagal diganti. Coba lagi." };
  return { judul: data.judul };
}
