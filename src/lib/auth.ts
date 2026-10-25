import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "user" | "guest";

export const getUser = cache(async () => {
  const supabase = await createClient();
  // Same check as proxy.ts. If the two disagreed (getUser here, getClaims there), a session one accepts
  // and the other rejects would bounce between / and /login forever.
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) redirect("/login");
  const { data: profile } = await supabase.from("profiles").select("role, full_name, gender, avatar_path").eq("id", claims.sub).single();
  // No profile row means the token belongs to a user that no longer exists: send them to sign in again.
  if (!profile) redirect("/login?keluar=1");
  const role = ((profile.role as Role | undefined) ?? "user") satisfies Role;
  return {
    id: claims.sub,
    email: (claims.email as string | undefined) ?? "",
    role,
    isAdmin: role === "admin",
    isGuest: role === "guest",
    name: (profile?.full_name as string | null) ?? null,
    gender: (profile?.gender as "male" | "female" | null) ?? null,
    avatarPath: (profile?.avatar_path as string | null) ?? null,
    supabase,
  };
});

export async function requireAdmin() {
  const user = await getUser();
  if (!user.isAdmin) redirect("/");
  return user;
}
