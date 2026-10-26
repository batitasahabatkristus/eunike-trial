import { MODULE_LABEL, ROUTES, decide, type ModuleKey, type Role } from "@/lib/roles";

export interface NavItem { module: ModuleKey; label: string; href: string; icon: string }
export interface SubItem { href: string; label: string; icon: string }

const ICON: Record<ModuleKey, string> = {
  home: "🏠", sk: "📖", admissions: "📝", finance: "💳", konseling: "🤝",
  markom: "📣", ktb: "👥", event: "🎟️", staf: "🗂️", pengurus: "📊",
};

const effective = (roles: readonly Role[], active: Role | null) => (active && roles.includes(active) ? [active, ...roles.filter((r) => r === "super_admin")] : [...roles]);

/** Modules a person can open. The first accessible route of each module is its entry point. */
export function navFor(roles: readonly Role[], active: Role | null): NavItem[] {
  const eff = effective(roles, active);
  const seen = new Set<ModuleKey>();
  const out: NavItem[] = [];
  for (const r of ROUTES) {
    if (!r.module || seen.has(r.module) || r.pattern.includes("*") || r.pattern.includes("[")) continue;
    const ok = r.access === "authenticated" || (Array.isArray(r.access) && eff.some((x) => (r.access as readonly Role[]).includes(x)));
    if (!ok) continue;
    seen.add(r.module);
    out.push({ module: r.module, label: MODULE_LABEL[r.module], href: r.pattern, icon: ICON[r.module] });
  }
  return out;
}

/** Screens inside a module, shown under the active module in the sidebar (demo's per-role sidebars). Keyed by path prefix. */
const SUB: Record<string, SubItem[]> = {
  "/sk/keluarga": [
    { href: "/sk/keluarga", label: "Beranda", icon: "🏠" }, { href: "/sk/keluarga/alur", label: "Alur", icon: "🧭" },
    { href: "/sk/keluarga/ayat", label: "Ayat", icon: "📖" }, { href: "/sk/keluarga/sharing", label: "Sharing", icon: "💬" },
    { href: "/sk/keluarga/power", label: "PoWeR", icon: "👨‍👩‍👧" }, { href: "/sk/keluarga/memory-marker", label: "Memory Marker", icon: "📷" },
  ],
  "/sk/guru": [
    { href: "/sk/guru", label: "Home guru", icon: "🏠" }, { href: "/sk/guru/kelas", label: "Kelas saya", icon: "👥" },
    { href: "/sk/guru/absensi", label: "Absensi", icon: "📅" }, { href: "/sk/guru/memory-marker", label: "Memory Marker", icon: "📷" },
    { href: "/sk/guru/forum", label: "Forum", icon: "💬" }, { href: "/sk/guru/refleksi", label: "Refleksi 5G dan 4P", icon: "📄" },
    { href: "/sk/guru/pelajaran", label: "Pelajaran minggu ini", icon: "📝" },
  ],
  "/sk/kurikulum": [
    { href: "/sk/kurikulum", label: "Materi", icon: "📖" }, { href: "/sk/kurikulum/jadwal", label: "Jadwal terbit", icon: "🗓️" },
    { href: "/sk/kurikulum/pustaka", label: "Pustaka", icon: "📚" },
  ],
  "/sk/admin": [
    { href: "/sk/admin", label: "Dasbor", icon: "🏠" }, { href: "/sk/admin/keluarga", label: "Keluarga", icon: "👨‍👩‍👧" },
    { href: "/sk/admin/grup", label: "Grup", icon: "👥" }, { href: "/sk/admin/materi", label: "Tinjau materi", icon: "📖" },
    { href: "/sk/admin/jadwal", label: "Jadwal terbit", icon: "📅" }, { href: "/sk/admin/hadir", label: "Laporan hadir", icon: "📄" },
    { href: "/sk/admin/epk", label: "Persetujuan EPK", icon: "✅" }, { href: "/sk/admin/akun", label: "Akun dan peran", icon: "⚙️" },
  ],
  "/sk/admin/pendaftar": [
    { href: "/sk/admin/pendaftar", label: "Pendaftar", icon: "📝" }, { href: "/sk/admin/pendaftar/pasangan", label: "Pasangan", icon: "💑" },
    { href: "/sk/admin/wawancara", label: "Wawancara", icon: "🗣️" },
  ],
  "/keuangan": [{ href: "/keuangan/tagihan", label: "Tagihan", icon: "💳" }, { href: "/keuangan/laporan", label: "Laporan", icon: "📊" }],
  "/markom": [
    { href: "/markom/admin", label: "Kalender konten", icon: "🗓️" }, { href: "/markom/admin/pengumuman", label: "Pengumuman", icon: "📣" },
    { href: "/markom/website", label: "Website", icon: "🌐" },
  ],
  "/staf/saya": [{ href: "/staf/saya", label: "Beranda staf", icon: "🗂️" }, { href: "/staf/saya/evaluasi", label: "Evaluasi diri", icon: "📝" }],
  "/ktb/admin": [{ href: "/ktb/admin", label: "Kelompok", icon: "👥" }, { href: "/ktb/admin/rekap", label: "Rekap", icon: "📊" }],
  "/beranda": [
    { href: "/beranda", label: "Beranda", icon: "🏠" }, { href: "/beranda/jadwal", label: "Jadwal", icon: "📅" },
    { href: "/beranda/keluarga", label: "Keluarga saya", icon: "👨‍👩‍👧" }, { href: "/beranda/laporan", label: "Laporan semester", icon: "📄" },
    { href: "/beranda/parenting", label: "Parenting", icon: "🧸" }, { href: "/beranda/notifikasi", label: "Notifikasi", icon: "🔔" },
    { href: "/beranda/cari", label: "Pencarian", icon: "🔍" }, { href: "/beranda/pengaturan", label: "Pengaturan", icon: "⚙️" },
  ],
};

/** Only items the person may open. */
export function subNavsFor(roles: readonly Role[], active: Role | null): Record<string, SubItem[]> {
  const out: Record<string, SubItem[]> = {};
  for (const [prefix, items] of Object.entries(SUB)) {
    const ok = items.filter((i) => decide(i.href, roles, active) === "allow");
    if (ok.length > 1) out[prefix] = ok;
  }
  return out;
}

/** Mobile tab bars from the demo: SK lesson screens, Eunike parent screens, otherwise module tabs. */
export function bottomNavsFor(roles: readonly Role[], active: Role | null) {
  const subs = subNavsFor(roles, active);
  const pick = (prefix: string, hrefs: string[]) => (subs[prefix] ?? []).filter((i) => hrefs.includes(i.href));
  return {
    sk: pick("/sk/keluarga", ["/sk/keluarga", "/sk/keluarga/alur", "/sk/keluarga/ayat", "/sk/keluarga/sharing", "/sk/keluarga/power"]),
    eu: pick("/beranda", ["/beranda", "/beranda/jadwal", "/beranda/keluarga", "/beranda/pengaturan"]),
    modules: navFor(roles, active),
  };
}
