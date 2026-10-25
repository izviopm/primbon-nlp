"use client";

import { useActionState, useState } from "react";
import { Eye, EyeOff, UserRound } from "lucide-react";
import { motion } from "motion/react";
import { FocusFirstError } from "@/components/focus-error";
import { AKSARA_PRIMBON, Aksara, Gunungan } from "@/components/jawa";
import { Reveal } from "@/components/motion";
import { Button, Card, Field, focus, inputClass } from "@/components/ui";
import { signIn, type LoginState } from "./actions";
import { Panduan } from "./panduan";

export default function LoginPage() {
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});
  const [lihat, setLihat] = useState(false);
  const err = (f: LoginState["field"]) => (state.field === f ? state.error : undefined);

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative overflow-hidden border-b bg-linear-to-br from-gold-soft via-background to-primary-soft px-4 py-10 sm:px-8 lg:flex lg:flex-col lg:justify-center lg:border-r lg:border-b-0 lg:p-14">
        <div aria-hidden="true" className="pattern-kawung absolute inset-0 text-primary" />
        <Reveal className="relative mx-auto flex w-full max-w-lg flex-col gap-6">
          <div className="flex items-center gap-4">
            <Gunungan className="h-20 w-15 shrink-0 drop-shadow-sm sm:h-24 sm:w-18" />
            <div className="flex flex-col">
              <Aksara className="text-lg text-gold-text">{AKSARA_PRIMBON}</Aksara>
              <h1 className="font-serif text-3xl font-bold text-primary sm:text-4xl">Primbon NLP</h1>
            </div>
          </div>
          <p className="text-lg text-foreground/90">
            Tanya weton, neptu, dan kecocokan jodoh dengan bahasa sehari-hari. Mbah menjawab lewat <strong>mesin penterjemah rule-based</strong>, bukan tebakan.
          </p>
          <a href="#masuk" className={`self-start rounded-lg text-sm font-semibold text-primary underline underline-offset-4 lg:hidden ${focus}`}>
            Langsung masuk
          </a>
          <Panduan />
        </Reveal>
      </section>

      <section id="masuk" className="flex scroll-mt-4 items-center justify-center px-4 py-10 sm:py-16">
        <Reveal className="flex w-full max-w-md flex-col gap-6" delay={0.08}>
          <div className="flex flex-col gap-1">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">Sugeng rawuh</h2>
            <p className="text-muted-foreground">Selamat datang. Masuk dengan akun dari admin, atau coba sebagai tamu.</p>
          </div>

          <Card className="flex flex-col gap-5">
            <form action={action} className="flex flex-col gap-4" noValidate>
              <FocusFirstError trigger={state} />
              <Field id="email" label="Email atau username" error={err("email")}>
                <input
                  id="email"
                  name="email"
                  autoComplete="username"
                  autoCapitalize="none"
                  required
                  className={inputClass}
                  aria-invalid={!!err("email")}
                  aria-describedby={err("email") ? "email-error" : undefined}
                />
              </Field>
              <Field id="password" label="Password" error={err("password")}>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={lihat ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className={`${inputClass} pr-12`}
                    aria-invalid={!!err("password")}
                    aria-describedby={err("password") ? "password-error" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setLihat((v) => !v)}
                    aria-label={lihat ? "Sembunyikan password" : "Tampilkan password"}
                    aria-pressed={lihat}
                    className={`absolute inset-y-0 right-0 inline-flex w-11 cursor-pointer items-center justify-center rounded-r-xl text-muted-foreground hover:text-foreground ${focus}`}
                  >
                    {lihat ? <EyeOff aria-hidden="true" className="size-5" /> : <Eye aria-hidden="true" className="size-5" />}
                  </button>
                </div>
              </Field>
              <Button type="submit" disabled={pending}>
                {pending ? "Masuk…" : "Masuk"}
              </Button>
            </form>

            <div className="flex items-center gap-3 text-sm text-muted-foreground" aria-hidden="true">
              <span className="h-px flex-1 bg-border" /> atau <span className="h-px flex-1 bg-border" />
            </div>

            <form action={action}>
              <input type="hidden" name="guest" value="1" />
              <motion.div whileHover={{ y: -1 }}>
                <Button type="submit" variant="gold" className="w-full" disabled={pending}>
                  <UserRound aria-hidden="true" className="size-4" />
                  Masuk sebagai Tamu
                </Button>
              </motion.div>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Atau ketik username <strong>tamu</strong> dan password <strong>tamu</strong>. Kuota AI tamu terbatas.
              </p>
            </form>
          </Card>

          <p className="text-center text-sm text-muted-foreground">Tugas Kecerdasan Artifisial · Universitas Budi Luhur · © 2026 Izvio Prijaya Mumin</p>
        </Reveal>
      </section>
    </main>
  );
}
