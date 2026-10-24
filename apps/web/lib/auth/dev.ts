import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { ROLES, type Role, isRole } from "@/lib/roles";

export const DEV_COOKIE = "eunike_dev_session";
const key = () => new TextEncoder().encode(process.env.EUNIKE_DEV_AUTH_SECRET ?? "dev-only-not-a-secret");

export interface DevPersona { id: string; name: string; roles: Role[] }

/** Appendix B fake data. Never real people. */
export const DEV_PERSONAS: DevPersona[] = [
  { id: "dev-parent", name: "Keluarga Santoso (Papa Budi)", roles: ["parent"] },
  { id: "dev-parent-multi", name: "Keluarga Wijaya (Mama Lina)", roles: ["parent", "ktb_member", "event_participant"] },
  { id: "dev-prospect", name: "Calon Orang Tua Pranata", roles: ["prospect_parent"] },
  { id: "dev-guru", name: "Guru Kelas Elia", roles: ["sk_guru"] },
  { id: "dev-kurikulum", name: "Tim Kurikulum", roles: ["sk_kurikulum"] },
  { id: "dev-sk-admin", name: "Admin SK", roles: ["sk_admin"] },
  { id: "dev-reg-admin", name: "Admin Pendaftaran", roles: ["sk_registration_admin"] },
  { id: "dev-bendahara", name: "Bendahara", roles: ["bendahara"] },
  { id: "dev-ktb-fas", name: "Fasilitator KTB Kasih", roles: ["ktb_facilitator"] },
  { id: "dev-ktb-admin", name: "Admin KTB", roles: ["ktb_admin"] },
  { id: "dev-event-panitia", name: "Panitia Celebration SK", roles: ["event_committee"] },
  { id: "dev-staff", name: "Staf Eunike", roles: ["staff"] },
  { id: "dev-hrd", name: "HRD", roles: ["hrd"] },
  { id: "dev-konselor", name: "Konselor Ruth", roles: ["konselor"] },
  { id: "dev-konseling-admin", name: "Admin Konseling", roles: ["konseling_admin"] },
  { id: "dev-markom", name: "Mar-com", roles: ["markom"] },
  { id: "dev-pengurus", name: "Pengurus", roles: ["pengurus"] },
  { id: "dev-super", name: "Super Admin", roles: ["super_admin", "pengurus"] },
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
