import type { Metadata } from "next";
import { BarChart3, CircleAlert, Cog, Gauge, KeyRound, MessagesSquare, Sparkles, UserPlus, Users } from "lucide-react";
import { ActionForm } from "@/components/action-form";
import { Avatar } from "@/components/avatar";
import { Reveal } from "@/components/motion";
import { Badge, Card, EmptyState, Field, inputClass, PageTitle, SectionTitle, StatTile } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { hariIni, iso } from "@/lib/nlp/kalender";
import { createAdminClient } from "@/lib/supabase/server";
import { createUser, resetUserPassword, saveAiSettings, saveLimits, saveUserLimit, setRole } from "./actions";
import { AdminTabs } from "./admin-tabs";
import { AiSettingsFields } from "./ai-settings-fields";

export const metadata: Metadata = { title: "Admin" };

const PERAN: Record<string, string> = { admin: "Admin", user: "User", guest: "Tamu" };
const SUMBER: Record<string, { label: string; tone: "primary" | "nila" | "gold" | "muted" }> = {
  rule: { label: "Rule-based langsung", tone: "primary" },
  rule_ai: { label: "Rule-based, kalimat dirapikan AI", tone: "nila" },
  mbah: { label: "Tanya Mbah (AI)", tone: "gold" },
  gagal: { label: "Gagal / ditolak", tone: "muted" },
};

const genderChoices = [
  ["male", "Laki-laki"],
  ["female", "Perempuan"],
  ["", "Tidak disebutkan"],
] as const;

// Outside the component: reading the clock is not allowed during render.
function rentangStatistik() {
  const now = new Date();
  return { today: iso(hariIni(now)), weekAgo: new Date(now.getTime() - 7 * 86_400_000).toISOString() };
}

export default async function AdminPage() {
  const { supabase, id: myId } = await requireAdmin();
  const { today, weekAgo } = rentangStatistik();

  const [{ data: ai }, { data: settings }, { data: profiles }, { data: usage }, { data: logs }, { data: gagal }, { data: userLimits }, users] = await Promise.all([
    supabase.from("ai_settings").select("model, base_url, api_key_secret_id").eq("id", true).maybeSingle(),
    supabase.from("app_settings").select("key, value"),
    supabase.from("profiles").select("id, role, full_name, gender, avatar_path, created_at").order("created_at"),
    supabase.from("ai_usage").select("user_id, calls").eq("day", today),
    supabase.from("query_logs").select("sumber").gte("created_at", weekAgo).limit(10000),
    supabase.from("query_logs").select("id, input, kalimat_baku, created_at").eq("sumber", "gagal").order("created_at", { ascending: false }).limit(20),
    supabase.from("user_limits").select("user_id, ai_calls_per_day, unlimited"),
    createAdminClient().auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const setting = (k: string) => settings?.find((s) => s.key === k)?.value ?? {};
  const limits = setting("limits");
  const models: { id: string; name: string }[] = setting("ai_models").models ?? [];
  const emails = new Map(users.data.users.map((u) => [u.id, u.email]));
  const hitung = (s: string) => logs?.filter((l) => l.sumber === s).length ?? 0;
  const total = logs?.length ?? 0;
  const persen = (n: number) => (total ? `${Math.round((n / total) * 100)}%` : "0%");
  const aiHariIni = usage?.reduce((a, u) => a + u.calls, 0) ?? 0;
  /** Effective daily AI limit for one account, in the same order consume_ai_quota resolves it. */
  const limitDari = (id: string, role: string): { teks: string; angka: number | null; unlimited: boolean; khusus: boolean } => {
    if (role === "admin") return { teks: "Unlimited (admin)", angka: null, unlimited: true, khusus: false };
    const l = userLimits?.find((x) => x.user_id === id);
    if (l?.unlimited) return { teks: "Unlimited", angka: null, unlimited: true, khusus: true };
    if (l?.ai_calls_per_day != null) return { teks: `${l.ai_calls_per_day}/hari`, angka: l.ai_calls_per_day, unlimited: false, khusus: true };
    const d = role === "guest" ? limits.guest_per_day : limits.per_user_per_day;
    return { teks: d != null ? `${d}/hari (default)` : "Tanpa batas (default)", angka: d ?? null, unlimited: false, khusus: false };
  };

  const tabStatistik = (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile icon={MessagesSquare} label="Pertanyaan 7 hari" value={total} />
        <StatTile icon={Cog} label="Dijawab rule-based tanpa AI" value={persen(hitung("rule"))} hint={`${hitung("rule")} pertanyaan`} />
        <StatTile icon={Sparkles} tone="nila" label="Dibantu AI" value={persen(hitung("rule_ai") + hitung("mbah"))} hint={`${hitung("rule_ai")} dirapikan, ${hitung("mbah")} Tanya Mbah`} />
        <StatTile icon={Gauge} tone="gold" label="Panggilan AI hari ini" value={aiHariIni} hint={limits.global_per_day != null ? `dari ${limits.global_per_day}` : "tanpa batas"} />
      </div>
      <Card>
        <SectionTitle icon={BarChart3}>Sumber jawaban (7 hari)</SectionTitle>
        <ul className="flex flex-col gap-3">
          {Object.entries(SUMBER).map(([k, s]) => {
            const n = hitung(k);
            return (
              <li key={k} className="flex flex-col gap-1">
                <span className="flex items-center justify-between gap-2 text-sm">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <span className="tabular-nums">
                    {n} ({persen(n)})
                  </span>
                </span>
                <span aria-hidden="true" className="h-2 overflow-hidden rounded-full bg-muted">
                  <span className={`block h-full rounded-full ${k === "rule" ? "bg-primary" : k === "gagal" ? "bg-muted-foreground/40" : k === "mbah" ? "bg-gold" : "bg-nila"}`} style={{ width: persen(n) }} />
                </span>
              </li>
            );
          })}
        </ul>
      </Card>
      <Card>
        <SectionTitle icon={CircleAlert}>20 kalimat gagal terakhir</SectionTitle>
        <p className="-mt-2 mb-3 text-sm text-muted-foreground">Bahan untuk memperluas kamus sinonim di Scanner.</p>
        {!gagal?.length ? (
          <EmptyState icon={CircleAlert} title="Belum ada kalimat gagal" />
        ) : (
          <ul className="flex flex-col divide-y text-sm">
            {gagal.map((g) => (
              <li key={g.id} className="flex flex-col gap-0.5 py-2">
                <span className="break-words">{g.input}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(g.created_at).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  {g.kalimat_baku && ` · AI menulis: "${g.kalimat_baku}"`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );

  const tabAi = (
    <Card className="max-w-3xl border-nila/30">
      <SectionTitle icon={Sparkles} tone="nila">
        Pengaturan AI (OpenAI-compatible)
      </SectionTitle>
      <ActionForm action={saveAiSettings} submit="Simpan">
        <AiSettingsFields baseUrl={ai?.base_url ?? ""} hasKey={!!ai?.api_key_secret_id} models={models.length ? models : ai?.model ? [{ id: ai.model, name: "" }] : []} main={ai?.model ?? ""} />
      </ActionForm>
    </Card>
  );

  const tabLimit = (
    <Card className="max-w-xl">
      <SectionTitle icon={Gauge}>Limit harian AI</SectionTitle>
      <ActionForm action={saveLimits} submit="Simpan limit">
        <Field id="perUser" label="Default panggilan AI per user per hari" help="Kosongkan untuk tanpa batas. Bisa diganti per pengguna di tab Pengguna. Admin selalu unlimited.">
          <input id="perUser" name="perUser" type="number" inputMode="numeric" min={0} defaultValue={limits.per_user_per_day ?? ""} className={inputClass} aria-describedby="perUser-help" />
        </Field>
        <Field id="guest" label="Default panggilan AI akun tamu per hari" help="Dipakai bersama oleh semua pengunjung tamu.">
          <input id="guest" name="guest" type="number" inputMode="numeric" min={0} defaultValue={limits.guest_per_day ?? ""} className={inputClass} aria-describedby="guest-help" />
        </Field>
        <Field id="global" label="Batas global per hari" help="Total semua pengguna selain admin, termasuk yang unlimited. Pengaman biaya API key.">
          <input id="global" name="global" type="number" inputMode="numeric" min={0} defaultValue={limits.global_per_day ?? ""} className={inputClass} aria-describedby="global-help" />
        </Field>
        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3">
          <input type="checkbox" name="aiEnabled" defaultChecked={limits.ai_enabled !== false} className="size-5 accent-primary" />
          <span className="font-medium">AI aktif</span>
          <span className="text-sm text-muted-foreground">(matikan untuk kill switch; rule-based tetap jalan)</span>
        </label>
      </ActionForm>
    </Card>
  );

  const tabUsers = (
    <div className="grid items-start gap-4 lg:grid-cols-[1fr_1.4fr]">
      <Card>
        <SectionTitle icon={UserPlus}>Buat akun</SectionTitle>
        <ActionForm action={createUser} submit="Buat akun" resetOnSuccess>
          <Field id="new-name" label="Nama">
            <input id="new-name" name="name" autoComplete="off" maxLength={100} required className={inputClass} />
          </Field>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-medium">Jenis kelamin</legend>
            <div className="flex flex-wrap gap-2">
              {genderChoices.map(([value, label]) => (
                <label key={value || "none"} className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-4 text-sm hover:bg-muted has-[:checked]:border-primary has-[:checked]:bg-primary-soft">
                  <input type="radio" name="gender" value={value} defaultChecked={value === ""} className="size-4 accent-primary" />
                  {label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field id="new-role" label="Peran">
            <select id="new-role" name="role" defaultValue="user" className={inputClass}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </Field>
          <Field id="new-email" label="Email">
            <input id="new-email" name="email" type="email" autoComplete="off" required className={inputClass} />
          </Field>
          <Field id="new-password" label="Password awal" help="Minimal 8 karakter. Bagikan ke user lewat jalur yang aman.">
            <input id="new-password" name="password" type="password" autoComplete="new-password" required className={inputClass} aria-describedby="new-password-help" />
          </Field>
        </ActionForm>
      </Card>

      <Card>
        <SectionTitle icon={Users}>Pengguna</SectionTitle>
        <ul className="flex flex-col divide-y">
          {(profiles ?? []).map((p) => {
            const u = usage?.find((x) => x.user_id === p.id);
            const nama = p.role === "guest" ? "Tamu" : (p.full_name ?? emails.get(p.id) ?? p.id);
            const lim = limitDari(p.id, p.role);
            const bisaKelolaAkun = p.role !== "guest" && p.id !== myId;
            return (
              <li key={p.id} className="flex flex-col gap-3 py-4">
                <div className="flex items-center gap-3">
                  <Avatar path={p.avatar_path} gender={p.gender} name={nama} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium break-all">{nama}</p>
                    <p className="text-sm break-all text-muted-foreground">
                      {emails.get(p.id)} · AI hari ini: {u?.calls ?? 0}
                      {lim.angka != null && ` / ${lim.angka}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge tone={p.role === "admin" ? "primary" : p.role === "guest" ? "gold" : "muted"}>{PERAN[p.role]}</Badge>
                    <Badge tone={lim.unlimited ? "nila" : lim.khusus ? "gold" : "muted"}>
                      <Sparkles aria-hidden="true" className="size-3" /> {lim.teks}
                    </Badge>
                  </div>
                </div>
                {p.role !== "admin" && (
                  <details className="rounded-xl border">
                    <summary className="flex min-h-11 cursor-pointer items-center gap-2 px-3 text-sm font-medium">
                      <KeyRound aria-hidden="true" className="size-4 text-primary" /> {bisaKelolaAkun ? "Kelola akun dan limit AI" : "Limit AI"}
                    </summary>
                    <div className="flex flex-col gap-4 border-t p-3">
                      <ActionForm action={saveUserLimit} submit="Simpan limit AI" className="flex flex-col gap-3">
                        <input type="hidden" name="userId" value={p.id} />
                        <Field
                          id={`lim-${p.id}`}
                          label="Limit AI per hari"
                          help={`Kosongkan untuk memakai default (${p.role === "guest" ? (limits.guest_per_day ?? "tanpa batas") : (limits.per_user_per_day ?? "tanpa batas")}).`}
                        >
                          <input
                            id={`lim-${p.id}`}
                            name="calls"
                            type="number"
                            inputMode="numeric"
                            min={0}
                            defaultValue={lim.khusus && !lim.unlimited ? (lim.angka ?? "") : ""}
                            className={inputClass}
                            aria-describedby={`lim-${p.id}-help`}
                          />
                        </Field>
                        <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border px-3 has-[:checked]:border-nila has-[:checked]:bg-nila-soft">
                          <input type="checkbox" name="unlimited" defaultChecked={lim.unlimited} className="size-5 accent-nila" />
                          <span className="font-medium">Unlimited</span>
                          <span className="text-sm text-muted-foreground">(tetap dibatasi batas global)</span>
                        </label>
                      </ActionForm>
                      {bisaKelolaAkun && (
                        <>
                          <ActionForm action={setRole} submit="Simpan peran" className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <input type="hidden" name="userId" value={p.id} />
                            <Field id={`role-${p.id}`} label="Peran">
                              <select id={`role-${p.id}`} name="role" defaultValue={p.role} className={inputClass}>
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </Field>
                          </ActionForm>
                          <ActionForm action={resetUserPassword} submit="Set password baru" resetOnSuccess className="flex flex-col gap-3 sm:flex-row sm:items-end">
                            <input type="hidden" name="userId" value={p.id} />
                            <Field id={`pw-${p.id}`} label="Password sementara">
                              <input id={`pw-${p.id}`} name="password" type="password" autoComplete="new-password" minLength={8} required className={inputClass} />
                            </Field>
                          </ActionForm>
                        </>
                      )}
                    </div>
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <Reveal>
        <PageTitle sub="Pengguna, pengaturan AI, limit, dan statistik rule-based vs AI.">Admin</PageTitle>
      </Reveal>
      <AdminTabs
        tabs={[
          { value: "statistik", label: "Statistik", content: tabStatistik },
          { value: "ai", label: "AI", content: tabAi },
          { value: "limit", label: "Limit", content: tabLimit },
          { value: "users", label: "Pengguna", content: tabUsers },
        ]}
      />
    </main>
  );
}
