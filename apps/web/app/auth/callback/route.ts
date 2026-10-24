import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSession, landingFor } from "@/lib/auth/session";
import { routes, safeNext } from "@/lib/routes";

/** Completes Google and email-link sign-in (PKCE code exchange). */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const origin = process.env.SITE_URL ?? req.nextUrl.origin;
  if (!code) return NextResponse.redirect(`${origin}${routes.login}`);
  const { error } = await (await createClient()).auth.exchangeCodeForSession(code);
  if (error) return NextResponse.redirect(`${origin}${routes.login}`);
  const session = await getSession();
  return NextResponse.redirect(`${origin}${session ? landingFor(session, safeNext(req.nextUrl.searchParams.get("next"))) : routes.beranda}`);
}
