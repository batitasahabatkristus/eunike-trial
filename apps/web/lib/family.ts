import type { Q } from "@/lib/db";

export interface FamilyMember { id: string; relation: "papa" | "mama" | "wali" | "anak"; display_name: string; profile_id: string | null }
export interface Child { id: string; name: string; dob: string }
export interface FamilyCtx {
  id: string; name: string; member_code: string | null; data_status: "ok" | "cor" | "cek"; privacy_timeline: boolean; wa_number: string | null; created_at: string;
  members: FamilyMember[]; children: Child[];
  klass: { id: string; name: string; joined_at: string } | null;
}

const REL: Record<string, string> = { papa: "Papa", mama: "Mama", wali: "Wali", anak: "Anak" };
export const relLabel = (r: string) => REL[r] ?? r;

/** The signed-in parent's own family (RLS already limits rows; the filter picks the right one when someone has several). */
export async function loadFamily(q: Q, userId: string): Promise<FamilyCtx | null> {
  const f = await q.one<Omit<FamilyCtx, "members" | "children" | "klass">>(
    `select f.id, f.name, f.member_code, f.data_status, f.privacy_timeline, f.wa_number, f.created_at::text
       from public.families f join public.family_members fm on fm.family_id = f.id
      where fm.profile_id = $1 and fm.deleted_at is null and f.deleted_at is null order by f.created_at limit 1`, [userId]);
  if (!f) return null;
  const [members, children, klass] = await Promise.all([
    q<FamilyMember>("select id, relation, display_name, profile_id from public.family_members where family_id = $1 and deleted_at is null order by relation, display_name", [f.id]),
    q<Child>("select id, name, dob::text from public.children where family_id = $1 and deleted_at is null order by dob", [f.id]),
    q<{ id: string; name: string; joined_at: string }>(
      `select c.id, c.name, m.joined_at::text from public.sk_class_members m
         join public.sk_classes c on c.id = m.class_id join public.semesters s on s.id = c.semester_id and s.active
        where m.family_id = $1 order by m.joined_at desc limit 1`, [f.id]),
  ]);
  return { ...f, members, children, klass: klass[0] ?? null };
}
