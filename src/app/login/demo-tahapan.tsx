"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Cog, Database, GitBranch, Pause, Play, ScanText, Sparkles, Workflow } from "lucide-react";
import { easeOut } from "@/components/motion";
import { focus } from "@/components/ui";

// Auto-playing walkthrough on the login page: one sentence travelling through the four stages.

type Contoh = {
  kalimat: string;
  ai?: string;
  token: [string, string][];
  aturan: string[];
  sql: string;
  judul: string;
  rumus: string;
};

const CONTOH: Contoh[] = [
  {
    kalimat: "Apakah weton Senin Legi cocok dengan Jumat Kliwon?",
    token: [
      ["apakah", "tanya"],
      ["weton", "kunci"],
      ["senin", "hari"],
      ["legi", "pasaran"],
      ["cocok", "kunci"],
      ["dengan", "hubung"],
      ["jumat", "hari"],
      ["kliwon", "pasaran"],
    ],
    aturan: ["R1", "R4", "R7", "R9", "R10", "R11"],
    sql: "SELECT ... FROM weton_dari($1,$2,$3) a,\n  weton_dari($4,$5,$6) b, jodoh j\nWHERE j.sisa = MOD(a.neptu + b.neptu, 9)",
    judul: "Tinari",
    rumus: "9 + 14 = 23 → 23 mod 9 = 5",
  },
  {
    kalimat: "aku lahir 17an agustus 2003, wetonku apa ya?",
    ai: "apa weton orang yang lahir tanggal 17 agustus 2003",
    token: [
      ["apa", "tanya"],
      ["weton", "kunci"],
      ["orang", "hubung"],
      ["yang", "hubung"],
      ["lahir", "kunci"],
      ["tanggal", "kunci"],
      ["17", "angka"],
      ["agustus", "angka"],
      ["2003", "angka"],
    ],
    aturan: ["R1", "R2", "R12", "R13", "R14"],
    sql: "SELECT w.hari, w.pasaran, w.neptu\nFROM weton_dari(NULL, NULL, $1) w\n-- $1 = '2003-08-17'",
    judul: "Minggu Kliwon",
    rumus: "Neptu: Minggu (5) + Kliwon (8) = 13",
  },
];

const WARNA: Record<string, string> = {
  tanya: "bg-primary-soft text-primary",
  hari: "bg-gold-soft text-gold-text",
  pasaran: "bg-gold-soft text-gold-text",
  angka: "bg-nila-soft text-nila",
  kunci: "bg-muted text-foreground",
  hubung: "bg-muted text-muted-foreground",
};

const TAHAP = [
  { icon: ScanText, nama: "Scanner" },
  { icon: GitBranch, nama: "Parser" },
  { icon: Workflow, nama: "Translator" },
  { icon: Database, nama: "Evaluator" },
];

export function DemoTahapan() {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0); // which example
  const [t, setT] = useState(0); // stage reached, 0-4
  const [jalan, setJalan] = useState(true);
  const c = CONTOH[i];
  const tampil = reduce ? 4 : t;

  useEffect(() => {
    if (reduce || !jalan) return;
    const id = setTimeout(
      () => {
        if (t < 4) setT(t + 1);
        else {
          setI((i + 1) % CONTOH.length);
          setT(0);
        }
      },
      t === 4 ? 3200 : 1500,
    );
    return () => clearTimeout(id);
  }, [t, i, jalan, reduce]);

  return (
    <figure className="flex flex-col gap-3 rounded-3xl border border-gold/50 bg-card/90 p-4 shadow-sm backdrop-blur sm:p-5">
      <figcaption className="flex items-center justify-between gap-2">
        <span className="text-sm font-semibold text-muted-foreground">Contoh: begini Mbah memproses pertanyaan</span>
        {!reduce && (
          <button
            type="button"
            onClick={() => setJalan((v) => !v)}
            aria-label={jalan ? "Jeda animasi" : "Putar animasi"}
            className={`inline-flex size-11 cursor-pointer items-center justify-center rounded-xl text-muted-foreground hover:bg-muted ${focus}`}
          >
            {jalan ? <Pause aria-hidden="true" className="size-4" /> : <Play aria-hidden="true" className="size-4" />}
          </button>
        )}
      </figcaption>

      <AnimatePresence mode="wait">
        <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6, transition: { duration: 0.15 } }} transition={easeOut} className="flex flex-col gap-3">
          <p className="self-end rounded-2xl rounded-br-md bg-primary px-3 py-2 text-sm text-white">{c.kalimat}</p>
          {c.ai && (
            <p className="flex items-start gap-2 rounded-xl bg-nila-soft px-3 py-2 text-sm text-nila">
              <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>
                AI merapikan: <strong>“{c.ai}”</strong>
              </span>
            </p>
          )}

          <ol className="grid grid-cols-4 gap-1.5" aria-label="Tahapan">
            {TAHAP.map(({ icon: Icon, nama }, k) => (
              <li
                key={nama}
                className={`flex flex-col items-center gap-1 rounded-xl px-1 py-2 text-center text-xs font-semibold transition-colors duration-300 ${k < tampil ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}
              >
                <Icon aria-hidden="true" className="size-4" />
                {nama}
              </li>
            ))}
          </ol>

          <div className="flex min-h-36 flex-col gap-2 text-sm">
            {tampil >= 1 && (
              <motion.ul initial="h" animate="s" variants={{ s: { transition: { staggerChildren: 0.05 } } }} className="flex flex-wrap gap-1" aria-label="Token">
                {c.token.map(([w, k], n) => (
                  <motion.li key={n} variants={{ h: { opacity: 0, y: 6 }, s: { opacity: 1, y: 0 } }} className={`rounded-md px-1.5 py-0.5 font-mono text-xs ${WARNA[k]}`}>
                    {w}
                  </motion.li>
                ))}
              </motion.ul>
            )}
            {tampil >= 2 && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                Aturan:
                {c.aturan.map((a) => (
                  <span key={a} className="rounded bg-primary-soft px-1 font-mono font-bold text-primary">
                    {a}
                  </span>
                ))}
              </motion.p>
            )}
            {tampil >= 3 && (
              <motion.pre initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="overflow-x-auto rounded-xl border border-gold/50 bg-gold-soft/50 p-2 font-mono text-[0.7rem] leading-relaxed">
                {c.sql}
              </motion.pre>
            )}
            {tampil >= 4 && (
              <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 24 }} className="flex items-center justify-between gap-2 rounded-xl border border-gold bg-card px-3 py-2">
                <span className="flex flex-col">
                  <span className="font-serif text-lg font-bold text-primary">{c.judul}</span>
                  <span className="font-mono text-xs text-muted-foreground">{c.rumus}</span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-semibold text-primary">
                  <Cog aria-hidden="true" className="size-3.5" /> Rule-based
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </figure>
  );
}
