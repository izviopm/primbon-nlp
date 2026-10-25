"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, CalendarSearch, Calculator, HeartHandshake, ListTree, SendHorizontal, Sparkles, UserRoundSearch, X } from "lucide-react";
import { Dialog } from "radix-ui";
import { Content as DrawerContent, Handle as DrawerHandle, Overlay as DrawerOverlay, Portal as DrawerPortal, Root as DrawerRoot } from "@animate-ui/react/primitives/radix-ui/drawer";
import { AKSARA_PRIMBON, Aksara, Gunungan } from "@/components/jawa";
import { easeOut } from "@/components/motion";
import { Button, focus } from "@/components/ui";
import type { Balasan, PesanRiwayat } from "@/lib/balasan";
import { DISCLAIMER } from "@/lib/nlp/evaluator";
import { MAKS_KARAKTER } from "@/lib/nlp/scanner";
import { LabelSumber, PanelTahapan } from "./tahapan";

type Pesan = { id: number; peran: "user"; teks: string } | { id: number; peran: "mbah"; balasan: Balasan };

const CONTOH = [
  { icon: CalendarDays, label: "Weton dari tanggal lahir", kalimat: "Apa weton orang yang lahir tanggal 17 Agustus 2003?" },
  { icon: Calculator, label: "Hitung neptu", kalimat: "Berapa neptu weton Senin Legi?" },
  { icon: HeartHandshake, label: "Cek kecocokan jodoh", kalimat: "Apakah weton Senin Legi cocok dengan Jumat Kliwon?" },
  { icon: CalendarSearch, label: "Cari tanggal weton", kalimat: "Kapan Jumat Kliwon berikutnya?" },
  { icon: UserRoundSearch, label: "Watak weton", kalimat: "Bagaimana watak orang dengan weton Rabu Pon?" },
  { icon: Sparkles, label: "Kalimat bebas (dibantu AI)", kalimat: "aku senin legi, pacarku jumat kliwon, cocok ga?" },
];

const adaJejak = (b: Balasan) => "jejak" in b && !!b.jejak;
const teksRiwayat = (p: Pesan): PesanRiwayat =>
  p.peran === "user"
    ? { peran: "user", isi: p.teks }
    : { peran: "assistant", isi: "jawaban" in p.balasan ? `${p.balasan.jawaban.judul}. ${p.balasan.jawaban.isi}` : p.balasan.sumber === "mbah" ? p.balasan.teks : p.balasan.pesan };

/** Tiny renderer for the AI's **bold** markdown; everything else stays plain text. */
function TeksMbah({ teks }: { teks: string }) {
  return (
    <p className="whitespace-pre-wrap">
      {teks.split(/(\*\*[^*]+\*\*)/g).map((s, i) => (s.startsWith("**") && s.endsWith("**") ? <strong key={i}>{s.slice(2, -2)}</strong> : s))}
    </p>
  );
}

export function Chat({ nama, isGuest }: { nama: string; isGuest: boolean }) {
  const [pesan, setPesan] = useState<Pesan[]>([]);
  const [input, setInput] = useState("");
  const [sibuk, setSibuk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dipilih, setDipilih] = useState<number | null>(null);
  const [drawer, setDrawer] = useState(false);
  const bawah = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nextId = useRef(1);
  const router = useRouter();

  useEffect(() => {
    bawah.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [pesan, sibuk]);

  const terpilih = pesan.find((p) => p.id === dipilih && p.peran === "mbah") as Extract<Pesan, { peran: "mbah" }> | undefined;
  // The question a selected answer belongs to: the user message right before it.
  const idxTerpilih = pesan.findIndex((p) => p.id === dipilih);
  const pertanyaanTerpilih = idxTerpilih > 0 && pesan[idxTerpilih - 1].peran === "user" ? (pesan[idxTerpilih - 1] as Extract<Pesan, { peran: "user" }>).teks : undefined;
  // The stage panel only earns its column once there is at least one answer with stages to show.
  const adaPanel = pesan.some((p) => p.peran === "mbah" && adaJejak(p.balasan));
  // Last canonical sentence lets the Normalizer resolve follow-ups like "kalau sama rabu pon?".
  const kalimatTerakhir = [...pesan]
    .reverse()
    .map((p) => (p.peran === "mbah" ? (p.balasan.sumber === "rule_ai" ? p.balasan.normalisasi.kalimat : p.balasan.sumber === "rule" ? p.balasan.jejak.scanner.praproses : null) : null))
    .find(Boolean);

  async function kirim(teks: string) {
    const isi = teks.trim();
    if (!isi || sibuk) return;
    if (isi.length > MAKS_KARAKTER) return setError(`Pertanyaan maksimal ${MAKS_KARAKTER} karakter.`);
    setError(null);
    setInput("");
    const riwayat = pesan.slice(-10).map(teksRiwayat);
    setPesan((p) => [...p, { id: nextId.current++, peran: "user", teks: isi }]);
    setSibuk(true);
    try {
      const res = await fetch("/api/tanya", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ pesan: isi, riwayat, kalimatTerakhir: kalimatTerakhir ?? undefined }),
      });
      if (res.status === 401) return router.push("/login");
      const body = await res.json().catch(() => null);
      if (!res.ok || !body) throw new Error(body?.error ?? "Mbah sedang tidak bisa menjawab. Coba lagi.");
      const id = nextId.current++;
      setPesan((p) => [...p, { id, peran: "mbah", balasan: body as Balasan }]);
      if (adaJejak(body)) setDipilih(id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSibuk(false);
      inputRef.current?.focus();
    }
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    kirim(input);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      kirim(input);
    }
  };
  const bukaTahapan = (id: number) => {
    setDipilih(id);
    if (!window.matchMedia("(min-width: 1024px)").matches) setDrawer(true);
  };

  return (
    <div className={`mx-auto grid w-full max-w-6xl flex-1 lg:gap-6 lg:px-4 ${adaPanel ? "lg:grid-cols-[minmax(0,1fr)_420px]" : ""}`}>
      {/* Chat column: its own scroll area so the input stays pinned on phones. Centered while it is the only column. */}
      <motion.section
        layout="position"
        transition={easeOut}
        aria-label="Percakapan"
        className={`flex h-[calc(100dvh-3.5rem-1px)] min-h-0 w-full flex-col lg:py-4 ${adaPanel ? "" : "lg:mx-auto lg:max-w-3xl"}`}
      >
        <div className="flex-1 overflow-y-auto px-4 pt-4 [scrollbar-width:thin] lg:px-1" aria-live="polite" aria-busy={sibuk}>
          {pesan.length === 0 ? (
            <Sambutan nama={nama} isGuest={isGuest} onPilih={kirim} />
          ) : (
            <ol className="flex flex-col gap-4 pb-4">
              <AnimatePresence initial={false}>
                {pesan.map((p) => (
                  <motion.li key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={easeOut} className="flex flex-col">
                    {p.peran === "user" ? (
                      <div className="max-w-[85%] self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-white shadow-sm">
                        <span className="sr-only">Kamu: </span>
                        {p.teks}
                      </div>
                    ) : (
                      <BalonMbah balasan={p.balasan} aktif={dipilih === p.id} onTahapan={() => bukaTahapan(p.id)} onContoh={kirim} />
                    )}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}
          {sibuk && (
            <div className="flex items-center gap-3 pb-4 text-muted-foreground" role="status">
              <Gunungan className="h-10 w-8" berpikir />
              <span>Mbah sedang menghitung…</span>
            </div>
          )}
          <div ref={bawah} />
        </div>

        <form onSubmit={onSubmit} className="border-t bg-card/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur lg:rounded-2xl lg:border lg:shadow-sm">
          {error && (
            <p role="alert" className="mb-2 text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex items-end gap-2">
            <label htmlFor="tanya" className="sr-only">
              Pertanyaan untuk Mbah
            </label>
            <textarea
              id="tanya"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              maxLength={MAKS_KARAKTER}
              placeholder="Tanya Mbah, misalnya: kapan jumat kliwon berikutnya?"
              className={`max-h-32 min-h-11 flex-1 resize-none rounded-xl border bg-background px-3 py-2.5 text-base field-sizing-content ${focus}`}
            />
            <Button type="submit" disabled={sibuk || !input.trim()} aria-label="Kirim pertanyaan" className="size-11 shrink-0 px-0">
              <SendHorizontal aria-hidden="true" className="size-5" />
            </Button>
          </div>
          <p className="mt-1.5 hidden text-xs text-muted-foreground sm:block">Enter untuk kirim, Shift+Enter untuk baris baru. {DISCLAIMER}</p>
        </form>
      </motion.section>

      {/* Desktop: stages beside the chat, sliding in with the first rule-based answer. */}
      <AnimatePresence>
        {adaPanel && (
          <motion.aside
            key="panel"
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 32 }}
            transition={{ ...easeOut, delay: 0.1 }}
            aria-label="Tahapan mesin penterjemah"
            className="hidden lg:block"
          >
            <div className="sticky top-4 mt-4 flex max-h-[calc(100dvh-6rem)] flex-col overflow-hidden rounded-2xl border border-gold/50 bg-card shadow-sm">
              <div className="relative shrink-0 overflow-hidden border-b border-gold/40 bg-linear-to-br from-gold-soft/80 to-card px-5 pt-4 pb-3">
                <div aria-hidden="true" className="pattern-kawung absolute inset-0 text-gold-text" />
                <div className="relative">
                  <JudulPanel pertanyaan={terpilih && adaJejak(terpilih.balasan) ? pertanyaanTerpilih : undefined} />
                </div>
              </div>
              <div className="overflow-y-auto px-5 py-3">
                {terpilih && adaJejak(terpilih.balasan) ? <PanelDari balasan={terpilih.balasan} /> : <RingkasTahap />}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Phones and tablets: the same panel in a bottom drawer. */}
      <DrawerRoot open={drawer} onOpenChange={setDrawer}>
        <DrawerPortal>
          <DrawerOverlay className="fixed inset-0 z-40 bg-foreground/30" />
          <DrawerContent className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85dvh] flex-col rounded-t-3xl border-t border-gold/60 bg-card pb-[env(safe-area-inset-bottom)] lg:hidden">
            <DrawerHandle className="mx-auto mt-3 mb-1 h-1.5 w-12 rounded-full bg-border" />
            <div className="flex items-center justify-between px-5 pt-2">
              <Dialog.Title asChild>
                <div>
                  <JudulPanel pertanyaan={pertanyaanTerpilih} />
                </div>
              </Dialog.Title>
              <Dialog.Close className={`-mt-4 inline-flex size-11 cursor-pointer items-center justify-center rounded-xl hover:bg-muted ${focus}`} aria-label="Tutup tahapan">
                <X aria-hidden="true" className="size-5" />
              </Dialog.Close>
            </div>
            <Dialog.Description className="sr-only">Hasil tiap tahap Scanner, Parser, Translator, dan Evaluator</Dialog.Description>
            <div className="overflow-y-auto px-5 pb-6">{terpilih && adaJejak(terpilih.balasan) && <PanelDari balasan={terpilih.balasan} />}</div>
          </DrawerContent>
        </DrawerPortal>
      </DrawerRoot>
    </div>
  );
}

function JudulPanel({ pertanyaan }: { pertanyaan?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <h2 className="flex items-center gap-2 font-serif text-lg font-semibold">
        <ListTree aria-hidden="true" className="size-5 text-primary" />
        Tahapan mesin
      </h2>
      {pertanyaan && <p className="line-clamp-2 text-sm text-muted-foreground">“{pertanyaan}”</p>}
    </div>
  );
}

const TAHAP_RINGKAS = [
  ["Scanner", "Memecah kalimat menjadi token berkelas"],
  ["Parser", "Mencocokkan token dengan aturan R1-R14"],
  ["Translator", "Menerjemahkan hasil parse ke SQL"],
  ["Evaluator", "Menjalankan SQL dan menghitung jawaban"],
];

/** Shown when the selected answer has no stages (an AI-only reply): what the four stages do. */
function RingkasTahap() {
  return (
    <div className="flex flex-col gap-3 py-1">
      <p className="text-sm text-muted-foreground">Jawaban yang dipilih tidak melewati mesin. Klik “Lihat tahapan” pada jawaban berlabel Rule-based.</p>
      <ol className="flex flex-col">
        {TAHAP_RINGKAS.map(([nama, isi], i) => (
          <li key={nama} className="flex gap-3 pb-3 last:pb-0">
            <span className="flex flex-col items-center">
              <span className="inline-flex size-7 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">{i + 1}</span>
              {i < TAHAP_RINGKAS.length - 1 && <span aria-hidden="true" className="mt-1 w-0.5 flex-1 rounded-full bg-border" />}
            </span>
            <span className="flex flex-col pb-1">
              <span className="font-semibold">{nama}</span>
              <span className="text-sm text-muted-foreground">{isi}</span>
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function PanelDari({ balasan }: { balasan: Balasan }) {
  if (!("jejak" in balasan) || !balasan.jejak) return null;
  return <PanelTahapan jejak={balasan.jejak} normalisasi={"normalisasi" in balasan ? balasan.normalisasi : undefined} galat={balasan.sumber === "gagal" ? balasan.galatParser : undefined} />;
}

function Sambutan({ nama, isGuest, onPilih }: { nama: string; isGuest: boolean; onPilih: (k: string) => void }) {
  return (
    <div className="flex flex-col items-center gap-6 py-6 text-center sm:py-10">
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 -m-6 rounded-full bg-gold-soft blur-2xl" />
        <Gunungan className="relative h-24 w-18" />
      </div>
      <div className="flex flex-col gap-2">
        <Aksara className="text-gold-text">{AKSARA_PRIMBON}</Aksara>
        <h1 className="font-serif text-2xl font-bold sm:text-3xl">Sugeng rawuh, {nama}!</h1>
        <p className="mx-auto max-w-md text-muted-foreground">
          Tanya Mbah soal weton, neptu, jodoh, tanggal, atau watak. Pilih contoh di bawah atau tulis sendiri.
          {isGuest && " Kamu masuk sebagai tamu, jadi bantuan AI dibatasi."}
        </p>
      </div>
      <ul className="grid w-full max-w-2xl gap-2 text-left sm:grid-cols-2">
        {CONTOH.map(({ icon: Icon, label, kalimat }, i) => (
          <motion.li key={label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ ...easeOut, delay: 0.05 * i }}>
            <button
              type="button"
              onClick={() => onPilih(kalimat)}
              className={`group flex h-full min-h-11 w-full cursor-pointer items-start gap-3 rounded-2xl text-left border bg-card p-3 shadow-sm transition duration-150 hover:-translate-y-0.5 hover:border-gold motion-safe:active:scale-98 ${focus}`}
            >
              <span className={`inline-flex size-9 shrink-0 items-center justify-center rounded-xl ${i === CONTOH.length - 1 ? "bg-nila-soft text-nila" : "bg-gold-soft text-gold-text"}`}>
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="flex flex-col">
                <span className="text-sm font-semibold">{label}</span>
                <span className="text-sm text-muted-foreground">{kalimat}</span>
              </span>
            </button>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

function BalonMbah({ balasan, aktif, onTahapan, onContoh }: { balasan: Balasan; aktif: boolean; onTahapan: () => void; onContoh: (k: string) => void }) {
  const tombolTahapan = adaJejak(balasan) && (
    <button
      type="button"
      onClick={onTahapan}
      aria-pressed={aktif}
      className={`inline-flex min-h-11 cursor-pointer items-center gap-1.5 self-start rounded-xl px-3 text-sm font-semibold text-primary hover:bg-primary-soft aria-pressed:bg-primary-soft ${focus}`}
    >
      <ListTree aria-hidden="true" className="size-4" /> Lihat tahapan
    </button>
  );

  if (balasan.sumber === "rule" || balasan.sumber === "rule_ai") {
    const { jawaban } = balasan;
    return (
      <article className={`relative max-w-[95%] self-start overflow-hidden rounded-2xl rounded-bl-md border bg-card p-4 shadow-sm transition-colors sm:max-w-[85%] ${aktif ? "border-gold" : "border-gold/50"}`}>
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-gold to-primary" />
        <div className="flex flex-col gap-3">
          <LabelSumber ai={balasan.sumber === "rule_ai"} />
          {balasan.sumber === "rule_ai" && (
            <p className="rounded-xl bg-nila-soft px-3 py-2 text-sm text-nila">
              Mbah membaca kalimatmu sebagai: <strong>“{balasan.normalisasi.kalimat}”</strong>
            </p>
          )}
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-bold text-primary">{jawaban.judul}</h2>
            <p>{jawaban.isi}</p>
          </div>
          {jawaban.rumus && <p className="rounded-xl bg-gold-soft/70 px-3 py-2 font-mono text-sm break-words">{jawaban.rumus}</p>}
          {jawaban.catatan && <p className="text-xs text-muted-foreground">{jawaban.catatan}</p>}
          {tombolTahapan}
        </div>
      </article>
    );
  }

  if (balasan.sumber === "mbah") {
    return (
      <article className="max-w-[95%] self-start rounded-2xl rounded-bl-md border border-nila/30 bg-card p-4 shadow-sm sm:max-w-[85%]">
        <div className="flex flex-col gap-2">
          <span className="inline-flex items-center gap-1 self-start rounded-full bg-nila-soft px-2.5 py-0.5 text-xs font-semibold text-nila">
            <Sparkles aria-hidden="true" className="size-3.5" /> Mbah AI · bukan hitungan primbon
          </span>
          <TeksMbah teks={balasan.teks} />
          <span className="text-xs text-muted-foreground">Model: {balasan.model}</span>
        </div>
      </article>
    );
  }

  return (
    <article className="max-w-[95%] self-start rounded-2xl rounded-bl-md border border-dashed border-primary/40 bg-card p-4 sm:max-w-[85%]">
      <div className="flex flex-col gap-3">
        <p>{balasan.pesan}</p>
        {balasan.contoh && (
          <ul className="flex flex-wrap gap-2" aria-label="Contoh kalimat baku">
            {balasan.contoh.map((k) => (
              <li key={k}>
                <button
                  type="button"
                  onClick={() => onContoh(k)}
                  className={`min-h-11 cursor-pointer rounded-xl border bg-background px-3 py-1.5 text-left text-sm hover:border-gold hover:bg-gold-soft/50 ${focus}`}
                >
                  {k}
                </button>
              </li>
            ))}
          </ul>
        )}
        {tombolTahapan}
      </div>
    </article>
  );
}

