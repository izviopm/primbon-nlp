"use client";

/* eslint-disable @next/next/no-img-element -- local preview of the chosen file (blob URL) */

import { startTransition, useActionState, useEffect, useState, type FormEvent } from "react";
import { CircleCheck, ImageUp } from "lucide-react";
import { Avatar, type Gender } from "@/components/avatar";
import { FocusFirstError } from "@/components/focus-error";
import { Button, Field, inputClass } from "@/components/ui";
import { kecilkanGambar } from "@/lib/gambar";
import { saveProfile, type ProfileState } from "./actions";

/** Shrinks to a 512 px WebP (PNG on Safari), named after the type actually produced. */
async function kecilkan(file: File): Promise<File | null> {
  const blob = await kecilkanGambar(file, 512, "image/webp");
  const ext = blob?.type === "image/webp" ? "webp" : blob?.type === "image/png" ? "png" : null;
  return blob && ext ? new File([blob], `${file.name.replace(/\.\w+$/, "")}.${ext}`, { type: blob.type }) : null;
}

export function ProfileForm({ name, gender, email, avatarPath }: { name: string | null; gender: Gender; email: string; avatarPath: string | null }) {
  const [state, action, pending] = useActionState<ProfileState, FormData>(saveProfile, {});
  const [preview, setPreview] = useState<string | null>(null);
  const [currentGender, setCurrentGender] = useState<Gender>(gender);
  const [remove, setRemove] = useState(false);
  const [menyiapkan, setMenyiapkan] = useState(false);
  const err = (f: ProfileState["field"]) => (state.field === f ? state.error : undefined);

  useEffect(() => () => {
    if (preview) URL.revokeObjectURL(preview);
  }, [preview]);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate>
      <FocusFirstError trigger={state.error ? state : null} />

      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        {preview ? (
          <img src={preview} alt="Pratinjau foto profil baru" className="size-24 shrink-0 rounded-full object-cover" />
        ) : (
          <Avatar path={remove ? null : avatarPath} gender={currentGender} name={name ?? undefined} size="lg" />
        )}
        <div className="flex flex-col gap-2">
          <label
            htmlFor="photo"
            className="inline-flex min-h-11 cursor-pointer items-center gap-2 self-start rounded-lg border bg-card px-4 text-sm font-medium transition-colors duration-150 hover:bg-muted focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 "
          >
            <ImageUp aria-hidden="true" className="size-4" /> {avatarPath || preview ? "Ganti foto" : "Unggah foto"}
            <input
              id="photo"
              name="photo"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              aria-invalid={!!err("photo")}
              aria-describedby={err("photo") ? "photo-error" : "photo-help"}
              onChange={async (e) => {
                const input = e.currentTarget;
                const f = input.files?.[0];
                if (!f) return setPreview(null);
                setRemove(false);
                setMenyiapkan(true);
                // Phone photos are often several MB: shrink to a 512 px WebP so the upload always fits the 2 MB limit.
                const kecil = await kecilkan(f);
                setMenyiapkan(false);
                if (kecil) {
                  const dt = new DataTransfer();
                  dt.items.add(kecil);
                  input.files = dt.files;
                }
                setPreview(URL.createObjectURL(kecil ?? f));
              }}
            />
          </label>
          <p id="photo-help" className="text-sm text-muted-foreground">
            {menyiapkan ? "Menyiapkan foto…" : "PNG, JPG, atau WebP. Foto besar otomatis dikecilkan. Tanpa foto, gambar bawaan sesuai jenis kelamin yang ditampilkan."}
          </p>
          {avatarPath && !preview && (
            <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm ">
              <input type="checkbox" name="removePhoto" checked={remove} onChange={(e) => setRemove(e.target.checked)} className="size-4 accent-primary" />
              Hapus foto saya
            </label>
          )}
          {err("photo") && (
            <p id="photo-error" className="text-sm text-destructive">
              {err("photo")}
            </p>
          )}
        </div>
      </div>

      <Field id="name" label="Nama" error={err("name")}>
        <input
          id="name"
          name="name"
          defaultValue={name ?? ""}
          autoComplete="name"
          maxLength={100}
          className={inputClass}
          aria-invalid={!!err("name")}
          aria-describedby={err("name") ? "name-error" : undefined}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium">Jenis kelamin</legend>
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["male", "Laki-laki"],
              ["female", "Perempuan"],
              ["", "Tidak disebutkan"],
            ] as const
          ).map(([value, label]) => (
            <label
              key={value || "none"}
              className="flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border px-4 text-sm transition-colors duration-150 hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary-soft "
            >
              <input
                type="radio"
                name="gender"
                value={value}
                checked={(currentGender ?? "") === value}
                onChange={() => setCurrentGender((value || null) as Gender)}
                className="size-4 accent-primary"
              />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      <Field id="email" label="Email" help="Email untuk masuk. Minta admin jika perlu diganti.">
        <input id="email" value={email} readOnly className={`${inputClass} bg-muted text-muted-foreground`} aria-describedby="email-help" />
      </Field>

      <div className="flex flex-wrap items-center gap-3">
        <Button type="submit" disabled={pending || menyiapkan}>
          {pending ? "Menyimpan…" : "Simpan profil"}
        </Button>
        <div aria-live="polite">
          {state.message && (
            <p className="flex items-center gap-1 text-sm text-success">
              <CircleCheck aria-hidden="true" className="size-4" /> {state.message}
            </p>
          )}
        </div>
      </div>
    </form>
  );
}
