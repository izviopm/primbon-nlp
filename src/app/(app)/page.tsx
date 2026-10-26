import { randomUUID } from "node:crypto";
import { getUser } from "@/lib/auth";
import type { Balasan } from "@/lib/balasan";
import { Chat, type PesanAwal } from "./chat";
import type { RingkasPercakapan } from "./riwayat";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Signed links for chat images: long enough for a session, short enough that a leaked link expires.
const UMUR_LINK = 6 * 3600;

// A fresh key for every visit to "/" so "Chat baru" always starts with an empty chat. Outside the component:
// generating ids is not allowed during render.
const kunciBaru = () => `baru-${randomUUID()}`;

export default async function TanyaPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const user = await getUser();
  const { c } = await searchParams;
  const nama = user.isGuest ? "Tamu" : (user.name?.split(" ")[0] ?? "Sedulur");

  let daftar: RingkasPercakapan[] = [];
  let awal: PesanAwal[] = [];
  let percakapanId: string | undefined;

  // The shared guest account never stores history (PRD 7).
  if (!user.isGuest) {
    const { data } = await user.supabase.from("percakapan").select("id, judul, updated_at").order("updated_at", { ascending: false }).limit(100);
    daftar = data ?? [];
    if (c && UUID.test(c) && daftar.some((d) => d.id === c)) {
      const { data: baris } = await user.supabase.from("pesan").select("peran, teks, gambar_path, balasan").eq("percakapan_id", c).order("id");
      const paths = (baris ?? []).map((b) => b.gambar_path).filter(Boolean) as string[];
      const { data: link } = paths.length ? await user.supabase.storage.from("chat-gambar").createSignedUrls(paths, UMUR_LINK) : { data: [] };
      const urlDari = new Map((link ?? []).map((l) => [l.path, l.signedUrl]));
      awal = (baris ?? []).flatMap((b): PesanAwal[] =>
        b.peran === "user"
          ? [{ peran: "user", teks: b.teks ?? "", gambar: (b.gambar_path && urlDari.get(b.gambar_path)) || undefined }]
          : b.balasan
            ? [{ peran: "mbah", balasan: b.balasan as Balasan }]
            : [],
      );
      percakapanId = c;
    }
  }

  return (
    <main className="flex flex-1 flex-col">
      <Chat key={percakapanId ?? kunciBaru()} nama={nama} isGuest={user.isGuest} percakapanIdAwal={percakapanId} pesanAwal={awal} daftarAwal={daftar} />
    </main>
  );
}
