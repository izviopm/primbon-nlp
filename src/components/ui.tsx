import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { CircleAlert, type LucideIcon } from "lucide-react";

// Shared primitives (UI_RULES). Adapted from Goukaku. Icons: Lucide only.

export const focus = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

const variants = {
  primary: "bg-primary text-white hover:bg-primary-strong",
  gold: "bg-gold text-foreground hover:bg-gold/85",
  nila: "bg-nila text-white hover:bg-nila/90",
  outline: "border border-border bg-card text-foreground hover:bg-muted",
  ghost: "text-foreground hover:bg-muted",
  destructive: "bg-destructive text-white hover:bg-destructive/90",
};
export type Variant = keyof typeof variants;

export const buttonClass = (variant: Variant = "primary", extra = "") =>
  `inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold cursor-pointer transition duration-150 ease-out motion-safe:active:scale-97 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 ${focus} ${variants[variant]} ${extra}`;

export function Button({ variant, className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={buttonClass(variant, className)} {...props} />;
}

export function LinkButton({ variant, className = "", ...props }: ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={buttonClass(variant, className)} {...props} />;
}

export function Card({ className = "", ...props }: ComponentProps<"section">) {
  return <section className={`rounded-2xl border bg-card p-5 shadow-sm sm:p-6 ${className}`} {...props} />;
}

export type Tone = "primary" | "gold" | "nila" | "muted";
const tones: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  gold: "bg-gold-soft text-gold-text",
  nila: "bg-nila-soft text-nila",
  muted: "bg-muted text-muted-foreground",
};

export function Badge({ tone = "primary", children, className = "" }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]} ${className}`}>{children}</span>;
}

export const inputClass = `w-full rounded-xl border bg-card px-3 py-2 text-base text-foreground min-h-11 placeholder:text-muted-foreground/80 ${focus} aria-invalid:border-destructive`;

export function Field({ id, label, help, error, children }: { id: string; label: string; help?: string; error?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      {children}
      {help && (
        <p id={`${id}-help`} className="text-sm text-muted-foreground">
          {help}
        </p>
      )}
      {error && <ErrorText id={`${id}-error`}>{error}</ErrorText>}
    </div>
  );
}

export function ErrorText({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="flex items-start gap-1 text-sm text-destructive">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

export function IconTile({ icon: Icon, tone = "primary" }: { icon: LucideIcon; tone?: Tone }) {
  return (
    <span className={`inline-flex size-10 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}>
      <Icon aria-hidden="true" className="size-5" />
    </span>
  );
}

export function SectionTitle({ icon, children, aside, tone }: { icon?: LucideIcon; children: ReactNode; aside?: ReactNode; tone?: Tone }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
      <h2 className="flex items-center gap-3 font-serif text-lg font-semibold">
        {icon && <IconTile icon={icon} tone={tone} />}
        {children}
      </h2>
      {aside}
    </div>
  );
}

export function PageTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h1 className="font-serif text-2xl font-bold sm:text-3xl">{children}</h1>
      {sub && <p className="text-muted-foreground">{sub}</p>}
    </div>
  );
}

export function StatTile({ icon, label, value, tone, hint }: { icon: LucideIcon; label: string; value: ReactNode; tone?: Tone; hint?: string }) {
  return (
    <Card className="flex items-center gap-4">
      <IconTile icon={icon} tone={tone} />
      <div className="flex min-w-0 flex-col">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-bold tabular-nums">{value}</span>
        {hint && <span className="text-xs font-medium text-muted-foreground">{hint}</span>}
      </div>
    </Card>
  );
}

export function EmptyState({ icon, title, children }: { icon: LucideIcon; title: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed bg-muted/50 px-6 py-10 text-center">
      <IconTile icon={icon} tone="muted" />
      <p className="font-semibold">{title}</p>
      {children && <div className="max-w-sm text-sm text-muted-foreground">{children}</div>}
    </div>
  );
}
