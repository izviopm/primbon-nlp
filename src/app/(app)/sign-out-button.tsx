"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { LogOut } from "lucide-react";
import { Gunungan } from "@/components/jawa";
import { spring } from "@/components/motion";
import { Button } from "@/components/ui";
import { signOut } from "./actions";

/** Header "Keluar" button that asks first. Native <dialog> gives the focus trap, Esc and inert page. From Goukaku. */
export function SignOutButton({ className, isGuest }: { className: string; isGuest: boolean }) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.showModal();
    cancelRef.current?.focus(); // safe default: Enter right away keeps the user signed in
  }, [open]);

  return (
    <>
      <button type="button" className={className} aria-haspopup="dialog" aria-label="Keluar" onClick={() => setOpen(true)}>
        <LogOut aria-hidden="true" className="size-4" />
        <span aria-hidden="true" className="hidden lg:inline">
          Keluar
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby="keluar-judul"
        aria-describedby="keluar-isi"
        // Esc: play the exit animation instead of closing instantly; close() runs once it finishes.
        onCancel={(e) => {
          e.preventDefault();
          setOpen(false);
        }}
        className="m-0 size-full max-h-none max-w-none bg-transparent p-0 backdrop:bg-transparent"
      >
        <AnimatePresence onExitComplete={() => dialogRef.current?.close()}>
          {open && (
            <div key="lembar" className="flex min-h-full items-center justify-center p-4">
              <motion.div
                aria-hidden="true"
                className="absolute inset-0 bg-foreground/30"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { duration: 0.2 } }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                onClick={() => setOpen(false)}
              />
              <motion.div
                className="relative flex w-full max-w-sm flex-col items-center gap-3 overflow-hidden rounded-3xl border border-gold/60 bg-card p-6 text-center shadow-sm"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: spring }}
                exit={{ opacity: 0, y: 8, scale: 0.98, transition: { duration: 0.15 } }}
              >
                <div aria-hidden="true" className="pattern-kawung absolute inset-x-0 top-0 h-24 text-gold-text" />
                <motion.span
                  aria-hidden="true"
                  className="relative inline-flex size-16 items-center justify-center rounded-full bg-gold-soft"
                  initial={{ scale: 0.6, rotate: -12 }}
                  animate={{ scale: 1, rotate: 0, transition: { ...spring, delay: 0.06 } }}
                >
                  <Gunungan className="h-11 w-9" />
                </motion.span>
                <h2 id="keluar-judul" className="relative font-serif text-xl font-bold">
                  Mau pamit dulu?
                </h2>
                <p id="keluar-isi" className="relative text-sm text-muted-foreground">
                  {isGuest
                    ? "Percakapan di halaman ini akan hilang. Untuk kembali, cukup klik Masuk sebagai Tamu lagi."
                    : "Riwayat percakapanmu tetap tersimpan, dan kamu bisa masuk lagi dengan email serta password."}
                </p>
                <div className="relative mt-3 flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                  <Button ref={cancelRef} type="button" variant="outline" className="w-full sm:w-auto" onClick={() => setOpen(false)}>
                    Batal
                  </Button>
                  <form action={signOut} className="w-full sm:w-auto">
                    <TombolKeluar />
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </dialog>
    </>
  );
}

function TombolKeluar() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full sm:w-auto" disabled={pending}>
      <LogOut aria-hidden="true" className="size-4" />
      {pending ? "Keluar…" : "Ya, keluar"}
    </Button>
  );
}
