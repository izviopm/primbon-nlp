import { HARI, PASARAN, JODOH, WATAK, WATAK_HARI, WATAK_PASARAN, WUKU, SUMBER_JODOH, SUMBER_WATAK, SUMBER_WATAK_HARI_PASARAN, SUMBER_WUKU } from "../src/lib/nlp/data.ts";

// Usage: node scripts/seed-sql.mjs          → base seed (migration 20261025000001)
//        node scripts/seed-sql.mjs rincian  → hari/pasaran watak + wuku (migration 20261026000003)
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const out = [];

if (process.argv[2] === "rincian") {
  out.push("-- Rincian primbon dari src/lib/nlp/data.ts (dibuat oleh scripts/seed-sql.mjs rincian, jangan diedit manual). Sumber: PRD 5.5.", "");
  for (const h of HARI) out.push(`update public.hari set watak = ${q(WATAK_HARI[h.nama])}, sumber_watak = ${q(SUMBER_WATAK_HARI_PASARAN)} where nama = ${q(h.nama)};`);
  out.push("");
  for (const p of PASARAN) out.push(`update public.pasaran set watak = ${q(WATAK_PASARAN[p.nama])}, sumber_watak = ${q(SUMBER_WATAK_HARI_PASARAN)} where nama = ${q(p.nama)};`);
  out.push("", "insert into public.wuku (urutan, nama, dewa, watak, sumber) values", WUKU.map((w, i) => `  (${i}, ${q(w.nama)}, ${q(w.dewa)}, ${q(w.watak)}, ${q(SUMBER_WUKU)})`).join(",\n") + ";");
} else {
  out.push("-- Data primbon dari src/lib/nlp/data.ts (dibuat oleh scripts/seed-sql.mjs, jangan diedit manual). Sumber: PRD 5.5.", "");
  out.push("insert into public.hari (nama, neptu, urutan) values", HARI.map((h, i) => `  (${q(h.nama)}, ${h.neptu}, ${i})`).join(",\n") + ";", "");
  out.push("insert into public.pasaran (nama, neptu, urutan) values", PASARAN.map((p, i) => `  (${q(p.nama)}, ${p.neptu}, ${i})`).join(",\n") + ";", "");
  out.push("insert into public.jodoh (sisa, nama, arti, sumber) values", JODOH.map((j) => `  (${j.sisa}, ${q(j.nama)}, ${q(j.arti)}, ${q(SUMBER_JODOH)})`).join(",\n") + ";", "");
  out.push("insert into public.watak (hari, pasaran, deskripsi, sumber) values", Object.entries(WATAK).map(([k, v]) => { const [h, p] = k.split(" "); return `  (${q(h)}, ${q(p)}, ${q(v)}, ${q(SUMBER_WATAK)})`; }).join(",\n") + ";");
}
console.log(out.join("\n"));
