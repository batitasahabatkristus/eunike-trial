import type { Metadata } from "next";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { AccountsTable, type AccountRow } from "@/components/app/AdminClients";

export const metadata: Metadata = { title: "Akun dan peran" };

/** AD-03 */
export default async function Akun() {
  const session = await guard("/sk/admin/akun");
  if (!session) return null;
  const d = await asUser(session.userId, async (q) => ({
    rows: await q<AccountRow>(
      `select p.id, p.full_name as name, coalesce(p.email, '') as email, p.id = $1::uuid as me,
              coalesce((select json_agg(json_build_object('role', r.role::text, 'scope', r.scope_id, 'active', r.active)) from public.user_roles r
                         where r.profile_id = p.id and r.role in ('parent','sk_guru','sk_kurikulum','sk_admin')), '[]'::json) as roles
         from public.profiles p
        where p.deleted_at is null and (exists (select 1 from public.user_roles r where r.profile_id = p.id and r.role in ('parent','sk_guru','sk_kurikulum','sk_admin'))) order by p.full_name`, [session.userId]),
    classes: await q<{ id: string; name: string }>("select c.id, c.name from public.sk_classes c join public.semesters s on s.id = c.semester_id and s.active order by c.name"),
  }));
  return <div className="col g14"><h1 className="h1" style={{ fontSize: 32 }}>Akun dan peran</h1><AccountsTable rows={d.rows} classes={d.classes} /></div>;
}
