import { MODULE_LABEL, ROUTES, type ModuleKey, type Role } from "@/lib/roles";

export interface NavItem { module: ModuleKey; label: string; href: string; icon: string }

const ICON: Record<ModuleKey, string> = {
  home: "🏠", sk: "📖", admissions: "📝", finance: "💳", konseling: "🤝",
  markom: "📣", ktb: "👥", event: "🎟️", staf: "🗂️", pengurus: "📊",
};

/** Modules a person can open. The first accessible route of each module is its entry point. */
export function navFor(roles: readonly Role[], active: Role | null): NavItem[] {
  const effective = active && roles.includes(active) ? [active, ...roles.filter((r) => r === "super_admin")] : roles;
  const seen = new Set<ModuleKey>();
  const out: NavItem[] = [];
  for (const r of ROUTES) {
    if (!r.module || seen.has(r.module) || r.pattern.includes("*") || r.pattern.includes("[")) continue;
    const ok = r.access === "authenticated" || (Array.isArray(r.access) && effective.some((x) => (r.access as readonly Role[]).includes(x)));
    if (!ok) continue;
    seen.add(r.module);
    out.push({ module: r.module, label: MODULE_LABEL[r.module], href: r.pattern, icon: ICON[r.module] });
  }
  return out;
}
