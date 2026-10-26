import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { ROLES, type Role, isRole } from "@/lib/roles";

export const DEV_COOKIE = "eunike_dev_session";
const key = () => new TextEncoder().encode(process.env.EUNIKE_DEV_AUTH_SECRET ?? "dev-only-not-a-secret");

export interface DevPersona { id: string; name: string; roles: Role[] }

/** Appendix B fake data. Ids and roles mirror supabase/seed.sql; the database stays the authority for roles (see getSession). */
const U = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;
export const DEV_PERSONAS: DevPersona[] = [
  { id: U(1), name: "Rina Santoso (Mama, Kelas Elia)", roles: ["parent"] },
  { id: U(2), name: "Daniel Santoso (Papa + Guru Elia)", roles: ["parent", "sk_guru"] },
  { id: U(3), name: "Maya Wijaya (Orang tua, KTB, Acara)", roles: ["parent", "ktb_member", "event_participant"] },
  { id: U(4), name: "Sari Pranata (Mama + Guru Markus)", roles: ["parent", "sk_guru"] },
  { id: U(5), name: "Dewi Saputra (Mama, Kelas Markus)", roles: ["parent"] },
  { id: U(25), name: "Calon Orang Tua Pranata", roles: ["prospect_parent"] },
  { id: U(15), name: "Maya (Kurikulum)", roles: ["sk_kurikulum"] },
  { id: U(10), name: "Ari (Admin SK)", roles: ["sk_admin"] },
  { id: U(17), name: "Admin Pendaftaran", roles: ["sk_registration_admin"] },
  { id: U(18), name: "Bendahara", roles: ["bendahara"] },
  { id: U(19), name: "Fasilitator KTB Kasih", roles: ["ktb_facilitator"] },
  { id: U(20), name: "Admin KTB", roles: ["ktb_admin"] },
  { id: U(21), name: "Panitia Celebration SK", roles: ["event_committee"] },
  { id: U(22), name: "Staf Eunike", roles: ["staff"] },
  { id: U(26), name: "Kepala Departemen", roles: ["head_department"] },
  { id: U(27), name: "Pembaca Jurnal", roles: ["journal_reader"] },
  { id: U(28), name: "Pewawancara", roles: ["interviewer"] },
  { id: U(29), name: "Admin Acara", roles: ["event_admin"] },
  { id: U(30), name: "Pembicara KTB", roles: ["ktb_speaker"] },
  { id: U(23), name: "HRD", roles: ["hrd"] },
  { id: U(11), name: "Konselor Ruth", roles: ["konselor"] },
  { id: U(12), name: "Admin Konseling", roles: ["konseling_admin"] },
  { id: U(24), name: "Mar-com", roles: ["markom"] },
  { id: U(14), name: "Pengurus", roles: ["pengurus"] },
  { id: U(13), name: "Super Admin", roles: ["super_admin", "pengurus"] },
];

export async function signDevSession(p: DevPersona): Promise<string> {
  return new SignJWT({ name: p.name, roles: p.roles })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.id)
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(key());
}

export async function readDevSession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    const roles = (Array.isArray(payload.roles) ? payload.roles : []).filter(isRole);
    return { userId: String(payload.sub), name: String(payload.name ?? ""), roles };
  } catch {
    return null;
  }
}

export const allRoles = ROLES;
