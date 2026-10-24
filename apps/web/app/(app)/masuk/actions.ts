"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { devAuthEnabled, siteUrl, supabaseConfigured } from "@/lib/env";
import { DEV_COOKIE, DEV_PERSONAS, signDevSession } from "@/lib/auth/dev";
import { ROLE_COOKIE, getSession, landingFor } from "@/lib/auth/session";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { routes, safeNext } from "@/lib/routes";
import { isRole } from "@/lib/roles";
import { normalizePhone } from "@/lib/phone";

export interface LoginState { error?: "family" | "email" | "locked"; sent?: boolean }

const cookieOpts = { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" } as const;

async function audit(action: string, ok: boolean, ip: string) {
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  // No phone, DOB or email is written: outcome and IP only (PRD §0.1, §9.1).
  await createAdminClient().from("audit_log").insert({ action, row_table: "auth", after: { ok, ip } });
}

export async function devLogin(formData: FormData) {
  if (!devAuthEnabled()) redirect(routes.login);
  const persona = DEV_PERSONAS.find((p) => p.id === formData.get("persona"));
  if (!persona) redirect(routes.login);
  const jar = await cookies();
  jar.set(DEV_COOKIE, await signDevSession(persona), { ...cookieOpts, maxAge: 60 * 60 * 12 });
  jar.delete(ROLE_COOKIE);
  const session = await getSession();
  redirect(session ? landingFor(session, safeNext(formData.get("next"))) : routes.beranda);
}

const familySchema = z.object({
  phone: z.string().trim().min(8).max(20),
  dob: z.iso.date(),
});

export async function familyLogin(_: LoginState, form: FormData): Promise<LoginState> {
  const ip = await clientIp();
  const parsed = familySchema.safeParse({ phone: form.get("phone"), dob: form.get("dob") });
  if (!parsed.success) return { error: "family" };
  const phone = normalizePhone(parsed.data.phone);

  // PRD §7.1: 5 failures per number and a per-IP ceiling, 15-minute window.
  const allowed = (await rateLimit(`fam:${phone}`, 5, 900)) && (await rateLimit(`fam-ip:${ip}`, 30, 900));
  if (!allowed) { await audit("login.family.locked", false, ip); return { error: "locked" }; }
  if (!supabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { error: "family" };

  const admin = createAdminClient();
  const { data } = await admin.rpc("find_family_login", { p_phone: phone, p_dob: parsed.data.dob });
  const hit = Array.isArray(data) ? data[0] : null;
  if (!hit?.email) { await audit("login.family.fail", false, ip); return { error: "family" }; }

  // Sign the linked user in server-side. The admin API mints a one-time token we redeem immediately; the browser never sees it.
  const { data: link, error } = await admin.auth.admin.generateLink({ type: "magiclink", email: hit.email });
  const tokenHash = link?.properties?.hashed_token;
  if (error || !tokenHash) { await audit("login.family.fail", false, ip); return { error: "family" }; }
  const supabase = await createClient();
  const { error: verr } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "magiclink" });
  if (verr) { await audit("login.family.fail", false, ip); return { error: "family" }; }

  await audit("login.family.ok", true, ip);
  const session = await getSession();
  redirect(session ? landingFor(session, safeNext(form.get("next"))) : routes.beranda);
}

export async function magicLink(_: LoginState, form: FormData): Promise<LoginState> {
  const email = z.email().safeParse(String(form.get("email") ?? "").trim());
  if (!email.success) return { error: "email" };
  const ip = await clientIp();
  if (!(await rateLimit(`magic:${ip}`, 8, 900)) || !(await rateLimit(`magic:${email.data}`, 3, 900))) return { error: "locked" };
  if (!supabaseConfigured()) return { error: "email" };
  const supabase = await createClient();
  const next = safeNext(form.get("next"));
  await supabase.auth.signInWithOtp({
    email: email.data,
    options: { shouldCreateUser: false, emailRedirectTo: `${siteUrl()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` },
  });
  return { sent: true }; // identical answer whether or not the account exists
}

export async function googleLogin(form: FormData) {
  if (!supabaseConfigured()) redirect(routes.login);
  const supabase = await createClient();
  const next = safeNext(form.get("next"));
  const { data } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${siteUrl()}/auth/callback${next ? `?next=${encodeURIComponent(next)}` : ""}` },
  });
  redirect(data.url ?? routes.login);
}

export async function chooseRole(form: FormData) {
  const role = form.get("role");
  const session = await getSession();
  if (!session || !isRole(role) || !session.roles.includes(role)) redirect(routes.login);
  (await cookies()).set(ROLE_COOKIE, role, { ...cookieOpts, maxAge: 60 * 60 * 24 * 365 });
  redirect(landingFor({ ...session, active: role }, safeNext(form.get("next"))));
}

export async function logout() {
  if (supabaseConfigured()) await (await createClient()).auth.signOut();
  const jar = await cookies();
  jar.delete(DEV_COOKIE);
  jar.delete(ROLE_COOKIE);
  redirect(routes.login);
}
