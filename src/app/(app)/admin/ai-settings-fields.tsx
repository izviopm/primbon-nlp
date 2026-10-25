"use client";

import { useRef, useState, useTransition } from "react";
import { ArrowDown, ArrowUp, CircleCheck, DownloadCloud, Plug, Plus, Trash2 } from "lucide-react";
import { Badge, Button, ErrorText, Field, inputClass } from "@/components/ui";
import { fetchModels, testConnection } from "./actions";

type Row = { key: number; id: string; name: string };

/** Base URL, key, and an ordered model list: the main model first, the rest are backups (PRD 6.3). Adapted from Goukaku. */
export function AiSettingsFields(props: { baseUrl: string; hasKey: boolean; models: { id: string; name: string }[]; main: string }) {
  const [rows, setRows] = useState<Row[]>(() => (props.models.length ? props.models.map((m, i) => ({ key: i, ...m })) : [{ key: 0, id: "", name: "" }]));
  const nextKey = useRef(Math.max(props.models.length, 1));
  const [main, setMain] = useState(props.main);
  const [daftar, setDaftar] = useState<string[]>([]);
  const [info, setInfo] = useState<{ error?: string; message?: string }>({});
  const [pending, start] = useTransition();
  const baseRef = useRef<HTMLInputElement>(null);
  const keyRef = useRef<HTMLInputElement>(null);

  const valid = rows.filter((r) => r.id.trim());
  const update = (key: number, patch: Partial<Row>) => {
    const old = rows.find((r) => r.key === key)?.id.trim();
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)));
    if (patch.id !== undefined && old && main === old) setMain(patch.id.trim());
  };
  const move = (i: number, by: -1 | 1) =>
    setRows((rs) => {
      const next = [...rs];
      [next[i], next[i + by]] = [next[i + by], next[i]];
      return next;
    });
  const backups = valid.map((r) => r.id.trim()).filter((id) => id !== main);

  return (
    <>
      <Field id="baseUrl" label="Base URL" help="Alamat API OpenAI-compatible, biasanya diakhiri /v1. Contoh: https://openrouter.ai/api/v1">
        <input id="baseUrl" ref={baseRef} name="baseUrl" type="url" defaultValue={props.baseUrl} placeholder="https://openrouter.ai/api/v1" className={inputClass} aria-describedby="baseUrl-help" />
      </Field>

      <Field id="apiKey" label="API key" help={props.hasKey ? "Tersimpan terenkripsi di Supabase Vault. Kosongkan jika tidak ingin mengganti." : "Belum ada API key."}>
        <input id="apiKey" ref={keyRef} name="apiKey" type="password" autoComplete="off" className={inputClass} aria-describedby="apiKey-help" />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await fetchModels(baseRef.current?.value ?? "", keyRef.current?.value ?? "");
              if (r.models) setDaftar(r.models);
              setInfo(r.error ? { error: r.error } : { message: `${r.models?.length ?? 0} model ditemukan. Ketik di kolom Model ID untuk memilih.` });
            })
          }
        >
          <DownloadCloud aria-hidden="true" className="size-4" /> Ambil daftar model
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => start(async () => setInfo(await testConnection()))}
          title="Memakai pengaturan yang sudah tersimpan"
        >
          <Plug aria-hidden="true" className="size-4" /> Tes koneksi
        </Button>
      </div>
      <div aria-live="polite" className="text-sm">
        {pending && <span className="text-muted-foreground">Menghubungi provider…</span>}
        {!pending && info.message && (
          <span className="flex items-center gap-1 text-success">
            <CircleCheck aria-hidden="true" className="size-4" /> {info.message}
          </span>
        )}
        {!pending && info.error && <ErrorText>{info.error}</ErrorText>}
      </div>
      <datalist id="daftar-model">
        {daftar.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <fieldset className="flex flex-col gap-3">
        <legend className="mb-1 text-sm font-medium">Model</legend>
        <p className="-mt-1 text-sm text-muted-foreground">Urutan = prioritas cadangan. Jika model utama gagal, model berikutnya dicoba sesuai urutan.</p>
        <input type="hidden" name="models" value={JSON.stringify(valid.map(({ id, name }) => ({ id: id.trim(), name: name.trim() })))} />
        {rows.map((r, i) => (
          <div key={r.key} className="grid grid-cols-[1fr_auto] items-end gap-2 rounded-xl border p-3 sm:grid-cols-[1fr_1fr_auto]">
            <Field id={`model-id-${r.key}`} label="Model ID">
              <input
                id={`model-id-${r.key}`}
                list="daftar-model"
                value={r.id}
                onChange={(e) => update(r.key, { id: e.target.value })}
                placeholder="openai/gpt-5-mini"
                className={inputClass}
                autoComplete="off"
              />
            </Field>
            <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">
              <Field id={`model-name-${r.key}`} label="Nama tampilan">
                <input id={`model-name-${r.key}`} value={r.name} onChange={(e) => update(r.key, { name: e.target.value })} className={inputClass} autoComplete="off" />
              </Field>
            </div>
            <div className="col-start-2 row-start-1 flex sm:col-start-auto sm:row-start-auto">
              <Button type="button" variant="ghost" className="px-2" aria-label={`Naikkan ${r.id || i + 1}`} disabled={i === 0} onClick={() => move(i, -1)}>
                <ArrowUp aria-hidden="true" className="size-4" />
              </Button>
              <Button type="button" variant="ghost" className="px-2" aria-label={`Turunkan ${r.id || i + 1}`} disabled={i === rows.length - 1} onClick={() => move(i, 1)}>
                <ArrowDown aria-hidden="true" className="size-4" />
              </Button>
              <Button type="button" variant="ghost" className="px-2" aria-label={`Hapus model ${r.id || i + 1}`} disabled={rows.length === 1} onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                <Trash2 aria-hidden="true" className="size-4" />
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" className="self-start" onClick={() => setRows((rs) => [...rs, { key: nextKey.current++, id: "", name: "" }])}>
          <Plus aria-hidden="true" className="size-4" /> Tambah model
        </Button>
      </fieldset>

      <Field id="main" label="Model utama" help="Dipakai untuk Normalizer dan Tanya Mbah.">
        <select id="main" name="main" value={main} onChange={(e) => setMain(e.target.value)} className={inputClass} aria-describedby="main-help">
          <option value="">Pilih model…</option>
          {valid.map((r) => (
            <option key={r.key} value={r.id.trim()}>
              {r.name ? `${r.name} (${r.id})` : r.id}
            </option>
          ))}
        </select>
      </Field>
      {main && (
        <p className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
          Urutan dicoba: <Badge>{main}</Badge>
          {backups.map((b) => (
            <Badge key={b} tone="muted">
              {b}
            </Badge>
          ))}
        </p>
      )}
    </>
  );
}
