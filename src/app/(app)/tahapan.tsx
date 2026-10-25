"use client";

import type { ReactNode } from "react";
import { ChevronDown, Cog, Sparkles } from "lucide-react";
import { Root as Accordion, AccordionContent, AccordionHeader, AccordionItem, AccordionTrigger } from "@animate-ui/react/primitives/radix-ui/accordion";
import { focus } from "@/components/ui";
import type { Normalisasi } from "@/lib/balasan";
import type { Jejak } from "@/lib/nlp/mesin";
import type { Simpul } from "@/lib/nlp/parser";
import type { Kelas } from "@/lib/nlp/scanner";

// Panel tahapan (PRD 8): what each of the four stages produced for one question.

const KELAS: Record<Kelas, string> = {
  KATA_TANYA: "bg-primary-soft text-primary",
  HARI: "bg-gold-soft text-gold-text",
  PASARAN: "bg-gold-soft text-gold-text",
  BULAN: "bg-nila-soft text-nila",
  ANGKA: "bg-nila-soft text-nila",
  KATA_KUNCI: "bg-muted text-foreground",
  PENGHUBUNG: "bg-muted text-muted-foreground",
  TIDAK_DIKENAL: "border border-dashed border-destructive text-destructive",
};

function Tahap({ value, no, judul, ai, children }: { value: string; no: number | string; judul: string; ai?: boolean; children: ReactNode }) {
  return (
    <AccordionItem value={value} className="border-b last:border-b-0">
      <AccordionHeader>
        <AccordionTrigger className={`group flex min-h-12 w-full cursor-pointer items-center gap-3 py-2 text-left font-semibold ${focus} rounded-lg`}>
          <span
            className={`inline-flex size-7 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${ai ? "bg-nila" : "bg-primary"}`}
            aria-hidden="true"
          >
            {ai ? <Sparkles className="size-4" /> : no}
          </span>
          <span className="flex-1">{judul}</span>
          <ChevronDown aria-hidden="true" className="size-4 text-muted-foreground transition-transform duration-200 group-data-[state=open]:rotate-180" />
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent className="overflow-hidden">
        <div className="flex flex-col gap-3 pb-4 pl-10 text-sm">{children}</div>
      </AccordionContent>
    </AccordionItem>
  );
}

function Langkah({ items }: { items: string[] }) {
  return (
    <ol className="flex list-decimal flex-col gap-1 pl-4 text-muted-foreground marker:text-gold-text">
      {items.map((l, i) => (
        <li key={i} className="break-words">
          {l}
        </li>
      ))}
    </ol>
  );
}

function Pohon({ s }: { s: Simpul }) {
  if (s.teks !== undefined)
    return (
      <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${s.opsional ? "border border-dashed border-gold-text text-gold-text" : "bg-muted"}`} title={s.opsional ? "kata opsional" : undefined}>
        {s.teks}
      </span>
    );
  return (
    <div className="flex flex-col gap-1">
      <span className="flex items-center gap-1.5">
        <span className="font-mono text-xs font-semibold text-primary">{s.simbol}</span>
        {s.aturan && <span className="rounded bg-primary-soft px-1 text-[0.7rem] font-bold text-primary">{s.aturan}</span>}
      </span>
      <div className="ml-1.5 flex flex-wrap items-start gap-1.5 border-l-2 border-gold/50 pl-3">
        {s.anak?.map((a, i) => <Pohon key={i} s={a} />)}
      </div>
    </div>
  );
}

export function PanelTahapan({ jejak, normalisasi, galat }: { jejak: Jejak; normalisasi?: Normalisasi; galat?: string }) {
  const { scanner, parser, translator, evaluator } = jejak;
  const terbuka = ["normalizer", "scanner", "parser", "translator", "evaluator"];
  return (
    <Accordion type="multiple" defaultValue={terbuka} className="flex flex-col">
      {normalisasi && (
        <Tahap value="normalizer" no="AI" judul="Normalizer AI" ai>
          <p className="text-muted-foreground">Kalimat bebas ditulis ulang menjadi kalimat baku. AI tidak menghitung apa pun.</p>
          <div className="flex flex-col gap-1 rounded-xl bg-nila-soft p-3 text-nila">
            <span>
              <span className="font-semibold">Asli:</span> {normalisasi.asli}
            </span>
            <span>
              <span className="font-semibold">Baku:</span> {normalisasi.kalimat}
            </span>
            <span className="text-xs">Model: {normalisasi.model}</span>
          </div>
        </Tahap>
      )}

      <Tahap value="scanner" no={1} judul="Scanner">
        <Langkah items={scanner.langkah} />
        <ul className="flex flex-wrap gap-1.5" aria-label="Token">
          {scanner.token.map((t) => (
            <li key={t.posisi} className={`flex flex-col items-center rounded-lg px-2 py-1 ${KELAS[t.kelas]}`}>
              <span className="font-mono text-sm font-semibold">{t.teks}</span>
              <span className="text-[0.65rem] font-medium tracking-wide uppercase">{t.kelas.replace("_", " ")}</span>
            </li>
          ))}
        </ul>
      </Tahap>

      <Tahap value="parser" no={2} judul="Parser">
        {parser ? (
          <>
            <p className="flex flex-wrap items-center gap-1 text-muted-foreground">
              Aturan dipakai:
              {parser.aturan.map((a) => (
                <span key={a} className="rounded bg-primary-soft px-1.5 font-mono text-xs font-bold text-primary">
                  {a}
                </span>
              ))}
            </p>
            <p className="text-muted-foreground">
              Tipe kalimat: <strong className="text-foreground">{parser.makna.jenis}</strong>
            </p>
            <div className="overflow-x-auto rounded-xl border bg-background p-3">
              <Pohon s={parser.pohon} />
            </div>
          </>
        ) : (
          <p className="rounded-xl border border-destructive/40 bg-card p-3 text-destructive">{galat ?? "Kalimat tidak cocok dengan aturan produksi."}</p>
        )}
      </Tahap>

      {translator && (
        <Tahap value="translator" no={3} judul="Translator">
          <Langkah items={translator.langkah} />
          <pre className="overflow-x-auto rounded-xl border border-gold/50 bg-gold-soft/50 p-3 font-mono text-xs leading-relaxed text-foreground">
            <code>{translator.sql}</code>
          </pre>
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Parameter query</caption>
            <thead className="text-muted-foreground">
              <tr>
                <th className="py-1 pr-2 font-medium">Param</th>
                <th className="py-1 pr-2 font-medium">Nilai</th>
                <th className="py-1 font-medium">Arti</th>
              </tr>
            </thead>
            <tbody>
              {translator.parameter.map((p) => (
                <tr key={p.nama} className="border-t">
                  <td className="py-1 pr-2 font-mono font-semibold text-primary">{p.nama}</td>
                  <td className="py-1 pr-2 font-mono">{p.nilai ?? "NULL"}</td>
                  <td className="py-1 text-muted-foreground">{p.arti}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Tahap>
      )}

      {evaluator && (
        <Tahap value="evaluator" no={4} judul="Evaluator">
          <Langkah items={evaluator.langkah} />
          {evaluator.baris.length > 0 && (
            <div className="overflow-x-auto rounded-xl border">
              <table className="w-full text-left text-xs">
                <caption className="sr-only">Hasil query</caption>
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    {Object.keys(evaluator.baris[0])
                      .filter((k) => k !== "sumber")
                      .map((k) => (
                        <th key={k} className="px-2 py-1 font-medium whitespace-nowrap">
                          {k}
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                  {evaluator.baris.slice(0, 5).map((b, i) => (
                    <tr key={i} className="border-t align-top">
                      {Object.entries(b)
                        .filter(([k]) => k !== "sumber")
                        .map(([k, v]) => (
                          <td key={k} className={`px-2 py-1 font-mono ${k === "arti" || k === "deskripsi" ? "min-w-48" : "whitespace-nowrap"}`}>
                            {String(v)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Tahap>
      )}
    </Accordion>
  );
}

export function LabelSumber({ ai }: { ai: boolean }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
        <Cog aria-hidden="true" className="size-3.5" /> Rule-based
      </span>
      {ai && (
        <span className="inline-flex items-center gap-1 rounded-full bg-nila-soft px-2.5 py-0.5 text-xs font-semibold text-nila">
          <Sparkles aria-hidden="true" className="size-3.5" /> kalimat dirapikan AI
        </span>
      )}
    </span>
  );
}
