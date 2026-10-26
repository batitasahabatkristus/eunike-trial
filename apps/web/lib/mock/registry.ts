import type { Role } from "@/lib/roles";
import type { Screen } from "./types";
import { ADMISSIONS } from "./screens/admissions";
import { FINANCE } from "./screens/finance";
import { KONSELING } from "./screens/konseling";
import { KOMUNIKASI } from "./screens/komunikasi";
import { KTB } from "./screens/ktb";
import { EVENT } from "./screens/event";
import { PENGURUS, STAF } from "./screens/staf";

const TABLE: Record<string, Screen> = { ...ADMISSIONS, ...FINANCE, ...KONSELING, ...KOMUNIKASI, ...EVENT, ...STAF, "/pengurus": PENGURUS, "/ktb/admin": KTB.admin, "/ktb/admin/rekap": KTB.rekap };

const segs = (p: string) => p.split("/").filter(Boolean);
const fits = (pattern: string, path: string) => {
  const a = segs(pattern), b = segs(path);
  return a.length === b.length && a.every((s, i) => (s.startsWith("[") && s.endsWith("]")) || s === b[i]);
};

/** The mockup screen for a path, or undefined (the page then stays "Segera hadir"). Literal paths win over [param] paths. */
export function mockFor(path: string, roles: readonly Role[]): Screen | undefined {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  if (clean === "/ktb/kelompok") return roles.includes("ktb_facilitator") ? KTB.facilitator : roles.includes("ktb_speaker") ? KTB.speaker : KTB.member;
  if (TABLE[clean]) return TABLE[clean];
  const key = Object.keys(TABLE).find((k) => k.includes("[") && fits(k, clean));
  return key ? TABLE[key] : undefined;
}
