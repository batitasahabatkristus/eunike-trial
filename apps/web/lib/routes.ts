// PRD §4.3: all paths in one place so a move to subdomains (Q-13) is a config change.
export const routes = {
  home: "/",
  login: "/masuk",
  pickRole: "/pilih-peran",
  denied: "/akses-ditolak",
  beranda: "/beranda",
  privacy: "/privasi",
  terms: "/syarat",
  skRegister: "/sk/daftar",
  counseling: "/konseling/konseli",
  events: "/event/peserta",
} as const;

export const LOCALES = ["id", "en"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "id";
export const isLocale = (v: string): v is Locale => (LOCALES as readonly string[]).includes(v);

export const publicPath = (locale: Locale, path = "") => `/${locale}${path === "/" ? "" : path}`;

/** Only same-site relative paths survive; stops open redirects through `?next=`. */
export function safeNext(next: unknown): string | null {
  if (typeof next !== "string") return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return null;
  return next;
}
