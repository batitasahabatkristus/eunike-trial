// PRD §7.2 roles, §7.3 homes, §8 access table. Single source for proxy, server guards and UI.

export const ROLES = [
  "super_admin", "pengurus", "parent", "prospect_parent", "reference_giver", "journal_reader",
  "interviewer", "sk_guru", "sk_kurikulum", "sk_admin", "sk_registration_admin", "bendahara",
  "ktb_member", "ktb_facilitator", "ktb_speaker", "ktb_admin", "ktb_head", "event_participant",
  "event_committee", "event_admin", "staff", "hrd", "head_department", "konseli", "konselor",
  "konseling_admin", "markom",
  // OPEN Q-06: decided later; exist in the enum, hidden in the UI.
  "volunteer", "pendamping",
] as const;
export type Role = (typeof ROLES)[number];

export const DISABLED_ROLES: readonly Role[] = ["volunteer", "pendamping"];
export const isRole = (v: unknown): v is Role => typeof v === "string" && (ROLES as readonly string[]).includes(v);

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: "Super Admin", pengurus: "Pengurus", parent: "Orang Tua", prospect_parent: "Calon Orang Tua",
  reference_giver: "Pemberi Referensi", journal_reader: "Pembaca Jurnal", interviewer: "Pewawancara",
  sk_guru: "Guru SK", sk_kurikulum: "Kurikulum SK", sk_admin: "Admin SK",
  sk_registration_admin: "Admin Pendaftaran SK", bendahara: "Bendahara", ktb_member: "Anggota KTB",
  ktb_facilitator: "Fasilitator KTB", ktb_speaker: "Pembicara KTB", ktb_admin: "Admin KTB",
  ktb_head: "Kepala KTB", event_participant: "Peserta Acara", event_committee: "Panitia Acara",
  event_admin: "Admin Acara", staff: "Staf", hrd: "HRD", head_department: "Kepala Departemen",
  konseli: "Konseli", konselor: "Konselor", konseling_admin: "Admin Konseling", markom: "Mar-com",
  volunteer: "Relawan", pendamping: "Pendamping",
};

/** Roles that must enrol TOTP before reaching protected pages (PRD §7.1). Enforced when 2FA is wired in Phase 0 hardening. */
export const MFA_ROLES: readonly Role[] = ["super_admin", "sk_admin", "konseling_admin", "hrd", "bendahara", "pengurus"];

/** Roles that never get SK-only parent home (parent with other modules goes to /beranda). */
export function homeFor(role: Role, opts: { skOnly?: boolean } = {}): string {
  switch (role) {
    case "parent": return opts.skOnly ? "/sk/keluarga" : "/beranda";
    case "sk_guru": return "/sk/guru";
    case "sk_kurikulum": return "/sk/kurikulum";
    case "sk_admin": return "/sk/admin";
    case "sk_registration_admin": return "/sk/admin/pendaftar";
    case "prospect_parent": return "/sk/daftar/status";
    case "journal_reader": return "/sk/admin/jurnal";
    case "interviewer": return "/sk/admin/wawancara/saya";
    case "bendahara": return "/keuangan/tagihan";
    case "ktb_member": case "ktb_facilitator": case "ktb_speaker": return "/ktb/kelompok";
    case "ktb_admin": case "ktb_head": return "/ktb/admin";
    case "event_participant": return "/event/peserta";
    case "event_committee": return "/event/panitia";
    case "event_admin": return "/event/admin";
    case "staff": return "/staf/saya";
    case "head_department": return "/staf/head";
    case "hrd": return "/staf/hrd";
    case "konseli": return "/konseling/konseli";
    case "konselor": return "/konseling/konselor";
    case "konseling_admin": return "/konseling/admin";
    case "markom": return "/markom/admin";
    case "pengurus": case "super_admin": return "/pengurus";
    default: return "/beranda";
  }
}

export type Access = "public" | "token" | "authenticated" | readonly Role[];

export interface RouteRule {
  /** Pattern; `[x]` matches exactly one segment. A trailing `/*` matches any depth below. */
  pattern: string;
  access: Access;
  title: string;
  /** Requirement IDs, shown on placeholder pages so the build order stays visible. */
  reqs: readonly string[];
  /** Menu group for the app shell. */
  module?: ModuleKey;
}

export type ModuleKey = "home" | "sk" | "admissions" | "finance" | "konseling" | "markom" | "ktb" | "event" | "staf" | "pengurus";

const SK_PARENT: Access = ["parent"];
const ADMIN_SK: Access = ["sk_admin", "super_admin"];

/** PRD §8, one row per path family. Order matters: first match wins, so specific rows come first. */
export const ROUTES: readonly RouteRule[] = [
  { pattern: "/akses-ditolak", access: "public", title: "Akses ditolak", reqs: ["AC-01"] },
  { pattern: "/beranda", access: "authenticated", title: "Beranda", reqs: ["CO-01"], module: "home" },
  { pattern: "/beranda/persetujuan", access: "authenticated", title: "Persetujuan", reqs: ["CO-08"], module: "home" },
  { pattern: "/beranda/jadwal", access: ["parent", "staff"], title: "Jadwal", reqs: ["CO-02"], module: "home" },
  { pattern: "/beranda/keluarga", access: ["parent"], title: "Keluarga Saya", reqs: ["CO-03"], module: "home" },
  { pattern: "/beranda/keluarga/kartu", access: ["parent"], title: "Kartu Anggota", reqs: ["CO-04"], module: "home" },
  { pattern: "/beranda/keluarga/anak-grup", access: ["parent"], title: "Daftarkan Anak ke Grup", reqs: ["CO-05"], module: "home" },
  { pattern: "/beranda/notifikasi", access: ["parent", "staff"], title: "Notifikasi", reqs: ["CO-06"], module: "home" },
  { pattern: "/beranda/cari", access: ["parent", "staff"], title: "Pencarian", reqs: ["CO-07"], module: "home" },
  { pattern: "/beranda/pengaturan", access: ["parent", "staff"], title: "Pengaturan", reqs: ["CO-08"], module: "home" },
  { pattern: "/beranda/parenting", access: ["parent"], title: "Parenting", reqs: ["CO-09"], module: "home" },
  { pattern: "/beranda/laporan", access: ["parent"], title: "Laporan Semester", reqs: ["SK-12"], module: "home" },

  { pattern: "/sk/keluarga", access: SK_PARENT, title: "Sahabat Kristus", reqs: ["SK-01", "SK-02"], module: "sk" },
  { pattern: "/sk/keluarga/*", access: SK_PARENT, title: "Sahabat Kristus", reqs: ["SK-03..SK-12"], module: "sk" },
  { pattern: "/sk/guru", access: ["sk_guru"], title: "Guru SK", reqs: ["GU-01"], module: "sk" },
  { pattern: "/sk/guru/*", access: ["sk_guru"], title: "Guru SK", reqs: ["GU-02..GU-05"], module: "sk" },
  { pattern: "/sk/kurikulum", access: ["sk_kurikulum"], title: "Kurikulum SK", reqs: ["KU-01"], module: "sk" },
  { pattern: "/sk/kurikulum/*", access: ["sk_kurikulum"], title: "Kurikulum SK", reqs: ["KU-02..KU-04"], module: "sk" },
  { pattern: "/sk/admin/pendaftar", access: ["sk_registration_admin", "sk_admin"], title: "Pendaftar SK", reqs: ["AM-05"], module: "admissions" },
  { pattern: "/sk/admin/pendaftar/*", access: ["sk_registration_admin", "sk_admin"], title: "Pendaftar SK", reqs: ["AM-05", "AM-06", "AM-09"], module: "admissions" },
  { pattern: "/sk/admin/jurnal", access: ["journal_reader"], title: "Pembaca Jurnal", reqs: ["AM-07"], module: "admissions" },
  { pattern: "/sk/admin/wawancara/saya", access: ["interviewer"], title: "Pewawancara", reqs: ["AM-08"], module: "admissions" },
  { pattern: "/sk/admin/wawancara", access: ["sk_registration_admin", "sk_admin"], title: "Wawancara", reqs: ["AM-06"], module: "admissions" },
  { pattern: "/sk/admin", access: ADMIN_SK, title: "Admin SK", reqs: ["AD-01"], module: "sk" },
  { pattern: "/sk/admin/*", access: ADMIN_SK, title: "Admin SK", reqs: ["AD-02..AD-06"], module: "sk" },
  { pattern: "/sk/daftar", access: "public", title: "Pendaftaran SK", reqs: ["AM-01"], module: "admissions" },
  { pattern: "/sk/daftar/status", access: ["prospect_parent"], title: "Status Pendaftaran", reqs: ["AM-03"], module: "admissions" },
  { pattern: "/sk/daftar/*", access: "public", title: "Pendaftaran SK", reqs: ["AM-01", "AM-02"], module: "admissions" },
  { pattern: "/sk/referensi/[token]", access: "token", title: "Formulir Referensi", reqs: ["AM-04"], module: "admissions" },

  { pattern: "/keuangan/tagihan", access: ["bendahara", "super_admin"], title: "Tagihan", reqs: ["FN-01", "FN-02"], module: "finance" },
  { pattern: "/keuangan/laporan", access: ["bendahara", "super_admin"], title: "Laporan Keuangan", reqs: ["FN-03"], module: "finance" },

  { pattern: "/ktb/kelompok", access: ["ktb_member", "ktb_facilitator", "ktb_speaker"], title: "KTB", reqs: ["KT-01", "KT-02", "KT-05"], module: "ktb" },
  { pattern: "/ktb/admin", access: ["ktb_admin", "ktb_head"], title: "Admin KTB", reqs: ["KT-03", "KT-04"], module: "ktb" },
  { pattern: "/ktb/admin/rekap", access: ["ktb_admin", "ktb_head"], title: "Rekap KTB", reqs: ["KT-04"], module: "ktb" },

  { pattern: "/event/peserta", access: ["event_participant"], title: "Acara", reqs: ["EV-01"], module: "event" },
  { pattern: "/event/panitia", access: ["event_committee"], title: "Panitia Acara", reqs: ["EV-02"], module: "event" },
  { pattern: "/event/admin", access: ["event_admin"], title: "Admin Acara", reqs: ["EV-03"], module: "event" },

  { pattern: "/staf/saya", access: ["staff"], title: "Staf", reqs: ["ST-01"], module: "staf" },
  { pattern: "/staf/saya/evaluasi", access: ["staff"], title: "Evaluasi Diri", reqs: ["ST-04"], module: "staf" },
  { pattern: "/staf/head", access: ["head_department"], title: "Persetujuan Cuti", reqs: ["ST-02"], module: "staf" },
  { pattern: "/staf/hrd", access: ["hrd"], title: "HRD", reqs: ["ST-03"], module: "staf" },

  { pattern: "/markom/admin", access: ["markom"], title: "Kalender Konten", reqs: ["CM-04"], module: "markom" },
  { pattern: "/markom/admin/pengumuman", access: ["markom"], title: "Pengumuman", reqs: ["CM-01..CM-03"], module: "markom" },
  { pattern: "/markom/website", access: ["markom", "super_admin"], title: "Website CMS", reqs: ["WS-01..WS-06"], module: "markom" },

  // OPEN Q-05: public with consent + rate limit until answered.
  { pattern: "/konseling/konseli", access: "public", title: "Konseling", reqs: ["KN-01"], module: "konseling" },
  { pattern: "/konseling/konselor", access: ["konselor"], title: "Konselor", reqs: ["KN-04"], module: "konseling" },
  { pattern: "/konseling/admin", access: ["konseling_admin"], title: "Admin Konseling", reqs: ["KN-02", "KN-03"], module: "konseling" },

  { pattern: "/pengurus", access: ["pengurus", "super_admin"], title: "Eunike Hari Ini", reqs: ["PG-01", "PG-02"], module: "pengurus" },
];

function matches(pattern: string, path: string): boolean {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  for (let i = 0; i < p.length; i++) {
    if (p[i] === "*") return s.length > i;
    if (s[i] === undefined) return false;
    if (!(p[i].startsWith("[") && p[i].endsWith("]")) && p[i] !== s[i]) return false;
  }
  return s.length === p.length;
}

export function findRoute(path: string): RouteRule | undefined {
  const clean = path.length > 1 ? path.replace(/\/+$/, "") : path;
  return ROUTES.find((r) => matches(r.pattern, clean));
}

/** Top-level prefixes that belong to the logged-in app and are covered by the access table. */
export const APP_PREFIXES = ["/beranda", "/sk", "/ktb", "/event", "/staf", "/markom", "/konseling", "/keuangan", "/pengurus"] as const;
export const isAppPath = (path: string) => APP_PREFIXES.some((p) => path === p || path.startsWith(p + "/"));

export type Decision = "allow" | "login" | "deny" | "unknown";

/** `roles` is the set the person holds. `active` narrows to the current "Masuk sebagai" choice when given. */
export function decide(path: string, roles: readonly Role[] | null, active?: Role | null): Decision {
  const rule = findRoute(path);
  if (!rule) return isAppPath(path) ? "deny" : "unknown"; // default-deny for anything under an app prefix we do not know
  const a = rule.access;
  if (a === "public" || a === "token") return "allow";
  if (!roles) return "login";
  if (a === "authenticated") return "allow";
  const effective = active && roles.includes(active) ? [active, ...roles.filter((r) => r === "super_admin")] : roles;
  return effective.some((r) => a.includes(r)) ? "allow" : "deny";
}

export const MODULE_LABEL: Record<ModuleKey, string> = {
  home: "Beranda", sk: "Sahabat Kristus", admissions: "Pendaftaran", finance: "Keuangan", konseling: "Konseling",
  markom: "Komunikasi", ktb: "KTB", event: "Acara", staf: "Staf", pengurus: "Pengurus",
};
