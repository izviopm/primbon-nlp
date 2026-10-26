"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, History, MessageSquareText, Pencil, SquarePen, Trash2, X } from "lucide-react";
import { focus } from "@/components/ui";
import { gantiJudulPercakapan, hapusPercakapan } from "./riwayat-actions";

export type RingkasPercakapan = { id: string; judul: string; updated_at: string };

const fmt = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: "Asia/Jakarta" });
const fmtJam = new Intl.DateTimeFormat("id-ID", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" });

function waktu(iso: string, sekarang: number) {
  const d = new Date(iso);
  return sekarang - d.getTime() < 20 * 3_600_000 ? fmtJam.format(d) : fmt.format(d);
}

/** Conversation list: "Chat baru" plus the user's saved chats, newest first, each renamable and deletable after a confirm. */
export function DaftarRiwayat({
  daftar,
  aktif,
  onHapus,
  onGanti,
  onPilih,
}: {
  daftar: RingkasPercakapan[];
  aktif?: string;
  onHapus: (id: string) => void;
  onGanti: (id: string, judul: string) => void;
  onPilih?: () => void;
}) {
  const [konfirmasi, setKonfirmasi] = useState<string | null>(null);
  const [ubah, setUbah] = useState<string | null>(null);
  const [draf, setDraf] = useState("");
  const [galat, setGalat] = useState<string | null>(null);
  const [pending, start] = useTransition();
  // Read the clock once per render pass outside JSX; only used to pick "14.05" vs "26 Okt".
  const [sekarang] = useState(() => Date.now());

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <Link
        href="/"
        onClick={onPilih}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition hover:bg-primary-strong motion-safe:active:scale-97 ${focus}`}
      >
        <SquarePen aria-hidden="true" className="size-4" /> Chat baru
      </Link>

      <h2 className="flex items-center gap-2 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        <History aria-hidden="true" className="size-3.5" /> Riwayat
      </h2>
      {galat && (
        <p role="alert" className="px-1 text-sm text-destructive">
          {galat}
        </p>
      )}

      {daftar.length === 0 ? (
        <p className="px-1 text-sm text-muted-foreground">Belum ada percakapan. Chat yang kamu mulai akan tersimpan di sini.</p>
      ) : (
        <ul className="-mx-1 flex min-h-0 flex-col gap-0.5 overflow-y-auto overscroll-contain px-1 [scrollbar-width:thin]">
          <AnimatePresence initial={false}>
            {daftar.map((c) => (
              <motion.li key={c.id} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -12 }} className="group relative">
                {konfirmasi === c.id ? (
                  <div className="flex flex-col gap-2 rounded-xl border border-destructive/40 bg-card p-2 text-sm">
                    <span>
                      Hapus <strong className="break-words">“{c.judul}”</strong>?
                    </span>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const r = await hapusPercakapan(c.id);
                            setKonfirmasi(null);
                            if (r.error) setGalat(r.error);
                            else {
                              setGalat(null);
                              onHapus(c.id);
                            }
                          })
                        }
                        className={`min-h-9 flex-1 cursor-pointer rounded-lg bg-destructive px-2 font-semibold text-white disabled:opacity-60 ${focus}`}
                      >
                        {pending ? "Menghapus…" : "Hapus"}
                      </button>
                      <button type="button" onClick={() => setKonfirmasi(null)} className={`min-h-9 flex-1 cursor-pointer rounded-lg border px-2 font-semibold hover:bg-muted ${focus}`}>
                        Batal
                      </button>
                    </div>
                  </div>
                ) : ubah === c.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (draf.trim() === c.judul) return setUbah(null);
                      start(async () => {
                        const r = await gantiJudulPercakapan(c.id, draf);
                        if (r.error) setGalat(r.error);
                        else {
                          setGalat(null);
                          setUbah(null);
                          onGanti(c.id, r.judul!);
                        }
                      });
                    }}
                    className="flex items-center gap-1 rounded-xl border border-gold/60 bg-card p-1"
                  >
                    <input
                      autoFocus
                      value={draf}
                      maxLength={120}
                      onChange={(e) => setDraf(e.target.value)}
                      onKeyDown={(e) => e.key === "Escape" && setUbah(null)}
                      onFocus={(e) => e.target.select()}
                      aria-label="Judul percakapan"
                      className={`min-h-9 min-w-0 flex-1 rounded-lg bg-transparent px-2 text-sm ${focus}`}
                    />
                    <button
                      type="submit"
                      disabled={pending || !draf.trim()}
                      aria-label="Simpan judul"
                      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-primary hover:bg-primary-soft disabled:opacity-50 ${focus}`}
                    >
                      <Check aria-hidden="true" className="size-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setUbah(null)}
                      aria-label="Batal ganti judul"
                      className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted-foreground hover:bg-muted ${focus}`}
                    >
                      <X aria-hidden="true" className="size-4" />
                    </button>
                  </form>
                ) : (
                  <>
                    <Link
                      href={`/?c=${c.id}`}
                      onClick={onPilih}
                      aria-current={aktif === c.id ? "page" : undefined}
                      className={`flex min-h-11 items-center gap-2 rounded-xl py-2 pr-20 pl-3 text-sm transition-colors ${
                        aktif === c.id ? "bg-primary-soft font-semibold text-primary" : "hover:bg-muted"
                      } ${focus}`}
                    >
                      <MessageSquareText aria-hidden="true" className="size-4 shrink-0 opacity-70" />
                      <span className="min-w-0 flex-1 truncate">{c.judul}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{waktu(c.updated_at, sekarang)}</span>
                    </Link>
                    <div className="absolute top-0 right-0 flex opacity-100 lg:opacity-0 lg:group-hover:opacity-100 lg:focus-within:opacity-100">
                      <button
                        type="button"
                        onClick={() => {
                          setKonfirmasi(null);
                          setDraf(c.judul);
                          setUbah(c.id);
                        }}
                        aria-label={`Ganti judul percakapan ${c.judul}`}
                        className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-primary-soft hover:text-primary ${focus}`}
                      >
                        <Pencil aria-hidden="true" className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setUbah(null);
                          setKonfirmasi(c.id);
                        }}
                        aria-label={`Hapus percakapan ${c.judul}`}
                        className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive ${focus}`}
                      >
                        <Trash2 aria-hidden="true" className="size-4" />
                      </button>
                    </div>
                  </>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
