import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { devAuthEnabled, supabaseConfigured } from "@/lib/env";
import { DEV_COOKIE, readDevSession } from "@/lib/auth/dev";
import { decide, findRoute, homeFor, isRole, type Role, DISABLED_ROLES } from "@/lib/roles";
import { routes, safeNext } from "@/lib/routes";

export const ROLE_COOKIE = "eunike_role";

export interface Session {
  userId: string;
  name: string;
  roles: Role[];
  /** The "Masuk sebagai" choice; null when the person has not chosen yet. */
  active: Role | null;
  source: "supabase" | "dev";
}

/** Authoritative session read for server components and actions. Roles come from the database (RLS-scoped), not the cookie. */
export const getSession = cache(async (): Promise<Session | null> => {
  const jar = await cookies();
  const chosen = jar.get(ROLE_COOKIE)?.value;
  const pick = (roles: Role[]) => (isRole(chosen) && roles.includes(chosen) ? chosen : roles.length === 1 ? roles[0] : null);

  if (supabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      const { data: rows } = await supabase.from("user_roles").select("role").eq("active", true);
      const roles = [...new Set((rows ?? []).map((r) => r.role).filter(isRole))].filter((r) => !DISABLED_ROLES.includes(r));
      const meta = data.user.user_metadata as { full_name?: string } | undefined;
      return {
        userId: data.user.id,
        name: meta?.full_name ?? data.user.email ?? "Pengguna",
        roles,
        active: pick(roles),
        source: "supabase",
      };
    }
  }

  if (devAuthEnabled()) {
    const dev = await readDevSession(jar.get(DEV_COOKIE)?.value);
    if (dev) return { ...dev, active: pick(dev.roles), source: "dev" };
  }
  return null;
});

/** Current privacy-policy version a person must have accepted (PRD §9.4). Bump when the text changes. */
export const CONSENT_VERSION = "2026-10-draft";
export const CONSENT_PATH = "/beranda/persetujuan";

const hasConsent = cache(async (userId: string): Promise<boolean> => {
  const { data } = await (await createClient())
    .from("consents").select("id").eq("profile_id", userId).eq("type", "privacy").eq("version", CONSENT_VERSION).limit(1);
  return (data?.length ?? 0) > 0;
});

/** Defense in depth behind proxy.ts. RLS stays the real gate. */
export async function guard(path: string): Promise<Session | null> {
  const session = await getSession();
  const verdict = decide(path, session?.roles ?? null, session?.active);
  if (verdict === "login") redirect(`${routes.login}?next=${encodeURIComponent(path)}`);
  if (verdict === "deny") redirect(routes.denied);
  // First login: record consent before anything else (PRD §9.4, F-11). Dev personas are fake data and skip it.
  if (session?.source === "supabase" && path !== CONSENT_PATH && findRoute(path)?.access !== "public" && !(await hasConsent(session.userId))) {
    redirect(`${CONSENT_PATH}?next=${encodeURIComponent(path)}`);
  }
  return session;
}

/** Where to send a person right after login (PRD §4.3 step 5, §7.3). */
export function landingFor(session: Session, next?: string | null): string {
  const n = safeNext(next);
  if (n && decide(n, session.roles, session.active) === "allow") return n;
  if (session.roles.length > 1 && !session.active) return `${routes.pickRole}${n ? `?next=${encodeURIComponent(n)}` : ""}`;
  const role = session.active ?? session.roles[0];
  return role ? homeFor(role, { skOnly: false }) : routes.beranda;
}
