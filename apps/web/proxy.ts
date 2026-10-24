import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { jwtVerify } from "jose";
import { decide, isAppPath, isRole, type Role } from "@/lib/roles";
import { DEFAULT_LOCALE, LOCALES, routes, type Locale } from "@/lib/routes";

const PUBLIC_PAGES = new Set(["/tentang", "/program", "/kontak", "/privasi", "/syarat"]);

function preferredLocale(req: NextRequest): Locale {
  const header = req.headers.get("accept-language")?.toLowerCase() ?? "";
  for (const part of header.split(",")) {
    const tag = part.trim().slice(0, 2);
    if ((LOCALES as readonly string[]).includes(tag)) return tag as Locale;
  }
  return DEFAULT_LOCALE; // OPEN Q-08: Indonesian by default.
}

async function rolesFor(req: NextRequest, res: NextResponse): Promise<Role[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    const supabase = createServerClient(url, anon, {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list) => list.forEach(({ name, value, options }) => res.cookies.set(name, value, options)),
      },
    });
    // getClaims verifies the JWT signature, so this is not a trust-the-cookie check.
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) {
      const meta = data.claims.app_metadata as { roles?: unknown } | undefined;
      return (Array.isArray(meta?.roles) ? meta.roles : []).filter(isRole);
    }
  }
  const dev = req.cookies.get("eunike_dev_session")?.value;
  if (dev && process.env.EUNIKE_DEV_AUTH === "1" && process.env.VERCEL_ENV !== "production") {
    try {
      const key = new TextEncoder().encode(process.env.EUNIKE_DEV_AUTH_SECRET ?? "dev-only-not-a-secret");
      const { payload } = await jwtVerify(dev, key, { algorithms: ["HS256"] });
      return (Array.isArray(payload.roles) ? payload.roles : []).filter(isRole);
    } catch {
      return null;
    }
  }
  return null;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Locale entry points for the public website (F-02).
  if (pathname === "/" || PUBLIC_PAGES.has(pathname)) {
    const url = req.nextUrl.clone();
    url.pathname = `/${preferredLocale(req)}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next({ request: req });
  if (!isAppPath(pathname)) return res;

  // Access flow, PRD §4.3. Convenience layer only: server guards and Postgres RLS are the real gate (AC-01, AC-02).
  const roles = await rolesFor(req, res);
  const chosen = req.cookies.get("eunike_role")?.value;
  const verdict = decide(pathname, roles, isRole(chosen) ? chosen : null);

  if (verdict === "login") {
    const to = req.nextUrl.clone();
    to.pathname = routes.login;
    to.search = `?next=${encodeURIComponent(pathname + req.nextUrl.search)}`;
    return NextResponse.redirect(to);
  }
  if (verdict === "deny") {
    const to = req.nextUrl.clone();
    to.pathname = routes.denied;
    to.search = "";
    return NextResponse.redirect(to);
  }
  return res;
}

export const config = {
  matcher: ["/((?!_next/|api/|.*\\..*).*)"],
};
