import { HARI, PASARAN, JODOH, WATAK, SUMBER_JODOH, SUMBER_WATAK } from "../src/lib/nlp/data.ts";
const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const out = ["-- Data primbon dari src/lib/nlp/data.ts (dibuat oleh scripts/seed-sql.mjs, jangan diedit manual). Sumber: PRD 5.5.", ""];
out.push("insert into public.hari (nama, neptu, urutan) values", HARI.map((h, i) => `  (${q(h.nama)}, ${h.neptu}, ${i})`).join(",\n") + ";", "");
out.push("insert into public.pasaran (nama, neptu, urutan) values", PASARAN.map((p, i) => `  (${q(p.nama)}, ${p.neptu}, ${i})`).join(",\n") + ";", "");
out.push("insert into public.jodoh (sisa, nama, arti, sumber) values", JODOH.map((j) => `  (${j.sisa}, ${q(j.nama)}, ${q(j.arti)}, ${q(SUMBER_JODOH)})`).join(",\n") + ";", "");
out.push("insert into public.watak (hari, pasaran, deskripsi, sumber) values", Object.entries(WATAK).map(([k, v]) => { const [h, p] = k.split(" "); return `  (${q(h)}, ${q(p)}, ${q(v)}, ${q(SUMBER_WATAK)})`; }).join(",\n") + ";");
console.log(out.join("\n"));
