"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight, Cog, Database, GitBranch, MessageSquareText, RotateCcw, ScanText, Sparkles, Trophy, Workflow, type LucideIcon } from "lucide-react";
import { Button, focus } from "@/components/ui";

// Step-by-step guide on the login page (PRD 8): one sentence through every stage, with back/next.
// The traces below are real engine output (src/lib/nlp), captured for the two example sentences.

type Kelas = "KATA_TANYA" | "KATA_KUNCI" | "HARI" | "PASARAN" | "BULAN" | "ANGKA" | "PENGHUBUNG";
type Contoh = {
  label: string;
  kalimat: string;
  ai?: string;
  token: [string, Kelas][];
  aturan: string[];
  pohon: string;
  sql: string;
  parameter: [string, string][];
  hitung: string[];
  judul: string;
  isi: string;
  rumus: string;
};

const CONTOH: Contoh[] = [
  {
    label: "Kalimat baku",
    kalimat: "Apakah weton Senin Legi cocok dengan Jumat Kliwon?",
    token: [
      ["apakah", "KATA_TANYA"],
      ["weton", "KATA_KUNCI"],
      ["senin", "HARI"],
      ["legi", "PASARAN"],
      ["cocok", "KATA_KUNCI"],
      ["dengan", "PENGHUBUNG"],
      ["jumat", "HARI"],
      ["kliwon", "PASARAN"],
    ],
    aturan: ["R1", "R4", "R7", "R9", "R10", "R11"],
    pohon: "<Q_Jodoh> (R4)\n├ apakah\n├ <Subjek> → <Weton> senin legi\n├ cocok dengan\n└ <Subjek> → <Weton> jumat kliwon",
    sql: "SELECT ... a.neptu + b.neptu AS jumlah, j.nama\nFROM weton_dari($1, $2, $3) a,\n     weton_dari($4, $5, $6) b, jodoh j\nWHERE j.sisa = MOD(a.neptu + b.neptu, 9);",
    parameter: [
      ["$1", "senin"],
      ["$2", "legi"],
      ["$4", "jumat"],
      ["$5", "kliwon"],
    ],
    hitung: ["Senin (4) + Legi (5) = 9", "Jumat (6) + Kliwon (8) = 14", "9 + 14 = 23 → 23 mod 9 = 5", "Tabel jodoh sisa 5 = Tinari"],
    judul: "Tinari",
    isi: "Membawa keberuntungan, rezeki, dan kemudahan.",
    rumus: "Senin Legi (9) + Jumat Kliwon (14) = 23 → 23 mod 9 = 5",
  },
  {
    label: "Kalimat bebas (AI)",
    kalimat: "aku lahir 17an agustus 2003, wetonku apa ya?",
    ai: "apa weton orang yang lahir tanggal 17 agustus 2003",
    token: [
      ["apa", "KATA_TANYA"],
      ["weton", "KATA_KUNCI"],
      ["orang", "PENGHUBUNG"],
      ["yang", "PENGHUBUNG"],
      ["lahir", "KATA_KUNCI"],
      ["tanggal", "KATA_KUNCI"],
      ["17", "ANGKA"],
      ["agustus", "BULAN"],
      ["2003", "ANGKA"],
    ],
    aturan: ["R1", "R2", "R12", "R13", "R14"],
    pohon: "<Q_Weton> (R2)\n├ apa weton [orang yang] [lahir] tanggal\n└ <Tanggal> (R12)\n  ├ 17\n  ├ <Bulan> agustus (R13)\n  └ <Tahun> 2003 (R14)",
    sql: "SELECT w.hari, w.pasaran, w.neptu_hari, w.neptu_pasaran, w.neptu\nFROM weton_dari(NULL, NULL, $1) w;",
    parameter: [["$1", "2003-08-17"]],
    hitung: ["Hari dari kalender Masehi: Minggu", "Selisih hari dari 17 Agustus 1945 (Jumat Legi), mod 5 → Kliwon", "Neptu: Minggu (5) + Kliwon (8) = 13"],
    judul: "Minggu Kliwon",
    isi: "Orang yang lahir 17 Agustus 2003 memiliki weton Minggu Kliwon.",
    rumus: "Neptu: Minggu (5) + Kliwon (8) = 13",
  },
];

const WARNA: Record<Kelas, string> = {
  KATA_TANYA: "bg-primary-soft text-primary",
  HARI: "bg-gold-soft text-gold-text",
  PASARAN: "bg-gold-soft text-gold-text",
  BULAN: "bg-nila-soft text-nila",
  ANGKA: "bg-nila-soft text-nila",
  KATA_KUNCI: "bg-muted text-foreground",
  PENGHUBUNG: "bg-muted text-muted-foreground",
};

type Langkah = { id: string; icon: LucideIcon; nama: string; ai?: boolean; penjelasan: string; isi: (c: Contoh) => ReactNode };

const kotak = "rounded-xl border border-gold/50 bg-gold-soft/40 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words";

const LANGKAH: Langkah[] = [
  {
    id: "tanya",
    icon: MessageSquareText,
    nama: "Pertanyaan",
    penjelasan: "Kamu menulis pertanyaan dengan bahasa sehari-hari: weton, neptu, jodoh, tanggal, atau watak.",
    isi: (c) => <p className="self-end rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-white shadow-sm">{c.kalimat}</p>,
  },
  {
    id: "ai",
    icon: Sparkles,
    nama: "Normalizer AI",
    ai: true,
    penjelasan: "Kalimat ini terlalu bebas untuk aturan grammar. AI hanya menulis ulang jadi kalimat baku. AI tidak menghitung apa pun.",
    isi: (c) => (
      <div className="flex flex-col gap-2 rounded-xl bg-nila-soft p-3 text-sm text-nila">
        <span>
          <span className="font-semibold">Asli:</span> {c.kalimat}
        </span>
        <ChevronRight aria-hidden="true" className="size-4 rotate-90 self-center" />
        <span>
          <span className="font-semibold">Baku:</span> {c.ai}
        </span>
      </div>
    ),
  },
  {
    id: "scanner",
    icon: ScanText,
    nama: "Scanner",
    penjelasan: "Huruf kecil, buang tanda baca, ganti sinonim (misalnya ahad → minggu), lalu setiap kata diberi kelas.",
    isi: (c) => (
      <ul className="flex flex-wrap gap-1.5" aria-label="Token dan kelasnya">
        {c.token.map(([w, k], i) => (
          <motion.li key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 * i }} className={`flex flex-col items-center rounded-lg px-2 py-1 ${WARNA[k]}`}>
            <span className="font-mono text-sm font-semibold">{w}</span>
            <span className="text-[0.65rem] font-medium uppercase">{k.replace("_", " ")}</span>
          </motion.li>
        ))}
      </ul>
    ),
  },
  {
    id: "parser",
    icon: GitBranch,
    nama: "Parser",
    penjelasan: "Token dicocokkan dengan 14 aturan produksi. Jika tidak ada aturan yang cocok, kalimat ditolak (atau dibantu AI).",
    isi: (c) => (
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
          Aturan dipakai:
          {c.aturan.map((a) => (
            <span key={a} className="rounded bg-primary-soft px-1.5 font-mono text-xs font-bold text-primary">
              {a}
            </span>
          ))}
        </p>
        <pre className={kotak}>{c.pohon}</pre>
      </div>
    ),
  },
  {
    id: "translator",
    icon: Workflow,
    nama: "Translator",
    penjelasan: "Hasil parse diterjemahkan menjadi query SQL. Nilai dari kalimatmu masuk sebagai parameter, bukan digabung ke teks SQL.",
    isi: (c) => (
      <div className="flex flex-col gap-2">
        <pre className={kotak}>{c.sql}</pre>
        <p className="flex flex-wrap gap-1.5 text-xs">
          {c.parameter.map(([p, v]) => (
            <span key={p} className="rounded-md bg-muted px-1.5 py-0.5 font-mono">
              <span className="font-bold text-primary">{p}</span> = {v}
            </span>
          ))}
        </p>
      </div>
    ),
  },
  {
    id: "evaluator",
    icon: Database,
    nama: "Evaluator",
    penjelasan: "Query dijalankan di database (tabel hari, pasaran, jodoh, watak), lalu hasilnya dihitung.",
    isi: (c) => (
      <ol className="flex flex-col gap-1.5 text-sm">
        {c.hitung.map((h, i) => (
          <motion.li key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.12 * i }} className="flex items-start gap-2">
            <span className="mt-0.5 inline-flex size-5 shrink-0 items-center justify-center rounded-full bg-gold-soft text-xs font-bold text-gold-text">{i + 1}</span>
            <span className="font-mono text-xs leading-5">{h}</span>
          </motion.li>
        ))}
      </ol>
    ),
  },
  {
    id: "jawaban",
    icon: Trophy,
    nama: "Jawaban",
    penjelasan: "Mbah menjawab beserta cara hitungnya. Label menunjukkan siapa yang mengerjakan.",
    isi: (c) => (
      <div className="relative overflow-hidden rounded-2xl border border-gold bg-card p-4 shadow-sm">
        <div aria-hidden="true" className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-gold to-primary" />
        <span className="flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
            <Cog aria-hidden="true" className="size-3.5" /> Rule-based
          </span>
          {c.ai && (
            <span className="inline-flex items-center gap-1 rounded-full bg-nila-soft px-2.5 py-0.5 text-xs font-semibold text-nila">
              <Sparkles aria-hidden="true" className="size-3.5" /> kalimat dirapikan AI
            </span>
          )}
        </span>
        <p className="mt-2 font-serif text-2xl font-bold text-primary">{c.judul}</p>
        <p className="text-sm">{c.isi}</p>
        <p className="mt-2 rounded-lg bg-gold-soft/70 px-2 py-1 font-mono text-xs">{c.rumus}</p>
      </div>
    ),
  },
];

export function Panduan() {
  const [ci, setCi] = useState(0);
  const [i, setI] = useState(0);
  const [arah, setArah] = useState(1);
  const c = CONTOH[ci];
  const langkah = LANGKAH.filter((l) => !l.ai || c.ai);
  const l = langkah[i];
  const akhir = i === langkah.length - 1;

  const ke = (n: number) => {
    setArah(n >= i ? 1 : -1);
    setI(Math.max(0, Math.min(langkah.length - 1, n)));
  };
  const gantiContoh = (n: number) => {
    setCi(n);
    setArah(1);
    setI(0);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.target instanceof HTMLButtonElement && e.target.closest("[data-contoh]")) return;
    if (e.key === "ArrowRight") ke(i + 1);
    if (e.key === "ArrowLeft") ke(i - 1);
  };

  return (
    <section aria-labelledby="panduan-judul" onKeyDown={onKeyDown} className="flex flex-col gap-4 rounded-3xl border border-gold/50 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="panduan-judul" className="font-serif text-lg font-semibold">
          Cara Mbah menjawab
        </h2>
        <div data-contoh role="group" aria-label="Pilih contoh" className="flex rounded-xl bg-muted p-1">
          {CONTOH.map((x, n) => (
            <button
              key={x.label}
              type="button"
              aria-pressed={ci === n}
              onClick={() => gantiContoh(n)}
              className={`relative min-h-9 cursor-pointer rounded-lg px-3 text-xs font-semibold transition-colors ${ci === n ? "text-primary" : "text-muted-foreground hover:text-foreground"} ${focus}`}
            >
              {ci === n && <motion.span layoutId="contoh-pill" className="absolute inset-0 rounded-lg bg-card shadow-sm" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
              <span className="relative">{x.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Stepper: every step is clickable, so users can jump back to any earlier stage. */}
      <ol className="flex items-center gap-1" aria-label="Langkah">
        {langkah.map((x, n) => (
          <li key={x.id} className="flex flex-1 items-center gap-1 last:flex-none">
            <button
              type="button"
              onClick={() => ke(n)}
              aria-current={n === i ? "step" : undefined}
              aria-label={`Langkah ${n + 1}: ${x.nama}`}
              className={`inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 transition-colors duration-200 ${focus} ${
                n === i
                  ? x.ai
                    ? "border-nila bg-nila text-white"
                    : "border-primary bg-primary text-white"
                  : n < i
                    ? x.ai
                      ? "border-nila bg-nila-soft text-nila"
                      : "border-primary bg-primary-soft text-primary"
                    : "border-border bg-card text-muted-foreground hover:border-gold"
              }`}
            >
              <x.icon aria-hidden="true" className="size-4" />
            </button>
            {n < langkah.length - 1 && <span aria-hidden="true" className={`h-0.5 flex-1 rounded-full transition-colors duration-300 ${n < i ? "bg-primary" : "bg-border"}`} />}
          </li>
        ))}
      </ol>

      <div className="relative min-h-72 overflow-hidden sm:min-h-64">
        <AnimatePresence mode="wait" custom={arah} initial={false}>
          <motion.div
            key={`${ci}-${l.id}`}
            custom={arah}
            variants={{
              masuk: (d: number) => ({ opacity: 0, x: 24 * d }),
              tampil: { opacity: 1, x: 0 },
              keluar: (d: number) => ({ opacity: 0, x: -24 * d, transition: { duration: 0.12 } }),
            }}
            initial="masuk"
            animate="tampil"
            exit="keluar"
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-3"
          >
            <div aria-live="polite">
              <p className={`text-xs font-semibold tracking-wide uppercase ${l.ai ? "text-nila" : "text-gold-text"}`}>
                Langkah {i + 1} dari {langkah.length}
              </p>
              <h3 className="flex items-center gap-2 font-serif text-xl font-bold">{l.nama}</h3>
              <p className="text-sm text-muted-foreground">{l.penjelasan}</p>
            </div>
            <div className="flex flex-col">{l.isi(c)}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <Button type="button" variant="ghost" onClick={() => ke(i - 1)} disabled={i === 0}>
          <ChevronLeft aria-hidden="true" className="size-4" /> Sebelumnya
        </Button>
        <span className="hidden text-xs text-muted-foreground sm:inline">Tombol panah ← → juga bisa</span>
        {akhir ? (
          <Button type="button" variant="outline" onClick={() => (ci === 0 ? gantiContoh(1) : ke(0))}>
            {ci === 0 ? (
              <>
                Coba kalimat bebas <ChevronRight aria-hidden="true" className="size-4" />
              </>
            ) : (
              <>
                <RotateCcw aria-hidden="true" className="size-4" /> Ulangi
              </>
            )}
          </Button>
        ) : (
          <Button type="button" onClick={() => ke(i + 1)}>
            Berikutnya <ChevronRight aria-hidden="true" className="size-4" />
          </Button>
        )}
      </div>
    </section>
  );
}
