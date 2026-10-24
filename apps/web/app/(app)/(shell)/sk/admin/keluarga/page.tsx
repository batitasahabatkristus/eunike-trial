import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { Badge, Banner } from "@/components/ui/bits";
import { ImportFamilies } from "@/components/app/ImportFamilies";
import { ResolveButton } from "@/components/app/AdminClients";

export const metadata: Metadata = { title: "Keluarga" };
const PAGE = 25;
interface Row { id: string; name: string; parents: string | null; kids: string | null; klass: string | null; data_status: "ok" | "cor" | "cek"; correction: string | null; has_login: boolean }

/** AD-04. Paginated, searchable; corrections are resolved here and the parent is notified. */
export default async function KeluargaAdmin({ searchParams }: { searchParams: Promise<{ q?: string; hal?: string }> }) {
  const session = await guard("/sk/admin/keluarga");
  if (!session) return null;
  const sp = await searchParams;
  const q0 = (sp.q ?? "").trim().slice(0, 80);
  const page = Math.max(1, Number(sp.hal) || 1);
  const d = await asUser(session.userId, async (q) => {
    const where = `f.deleted_at is null and ($1 = '' or f.name ilike '%' || $1 || '%' or f.wa_number like '%' || regexp_replace($1, '\\D', '', 'g') || '%' and regexp_replace($1, '\\D', '', 'g') <> ''
       or exists (select 1 from public.children c where c.family_id = f.id and c.name ilike '%' || $1 || '%'))`;
    const total = Number((await q.one<{ n: string }>(`select count(*) n from public.families f where ${where}`, [q0]))?.n ?? 0);
    const rows = await q<Row>(
      `select f.id, f.name, f.data_status,
              (select string_agg(m.display_name, ', ' order by m.relation) from public.family_members m where m.family_id = f.id and m.relation <> 'anak' and m.deleted_at is null) parents,
              (select string_agg(c.name, ', ' order by c.dob) from public.children c where c.family_id = f.id and c.deleted_at is null) kids,
              (select k.name from public.sk_class_members cm join public.sk_classes k on k.id = cm.class_id join public.semesters s on s.id = k.semester_id and s.active where cm.family_id = f.id limit 1) klass,
              (select dc.body from public.data_corrections dc where dc.family_id = f.id and dc.status = 'open' order by dc.created_at desc limit 1) correction,
              exists (select 1 from public.family_members m where m.family_id = f.id and m.profile_id is not null) has_login
         from public.families f where ${where} order by f.name limit ${PAGE} offset ${(page - 1) * PAGE}`, [q0]);
    return { total, rows };
  });
  const badge = (s: Row["data_status"]) => (s === "ok" ? <Badge kind="ok">Terkonfirmasi</Badge> : s === "cor" ? <Badge kind="need">Perlu koreksi</Badge> : <Badge kind="warn">Perlu dicek</Badge>);
  const pages = Math.max(1, Math.ceil(d.total / PAGE));
  const href = (p: number) => `/sk/admin/keluarga?${q0 ? `q=${encodeURIComponent(q0)}&` : ""}hal=${p}`;
  return (
    <div className="col g14">
      <div className="row between wrap"><h1 className="h1" style={{ fontSize: 32 }}>Keluarga</h1><ImportFamilies /></div>
      <form role="search" className="row"><input className="inp" name="q" defaultValue={q0} placeholder="🔍 Cari keluarga, anak, atau nomor HP" aria-label="Cari keluarga, anak, atau nomor HP" /><button className="btn ghost sm">Cari</button></form>
      <div className="tblwrap"><table className="tbl">
        <thead><tr><th scope="col">Keluarga</th><th scope="col">Orang tua</th><th scope="col">Anak</th><th scope="col">Kelas</th><th scope="col">Status data</th><th scope="col">Aksi</th></tr></thead>
        <tbody>{d.rows.length === 0 ? <tr><td colSpan={6} className="center muted">Tidak ada keluarga yang cocok.</td></tr> : d.rows.map((f) => (
          <tr key={f.id}><td><b className="purple">{f.name}</b>{f.has_login ? null : <div className="xs muted">belum punya akun</div>}</td><td>{f.parents ?? "-"}</td><td>{f.kids ?? "-"}</td><td>{f.klass ?? "-"}</td>
            <td>{badge(f.data_status)}{f.correction ? <div className="xs muted" style={{ maxWidth: 220 }}>“{f.correction}”</div> : null}</td>
            <td>{f.data_status !== "ok" ? <ResolveButton familyId={f.id} /> : <span className="muted">–</span>}</td></tr>
        ))}</tbody></table></div>
      <div className="row between small"><span className="muted">{d.total} keluarga · halaman {page} dari {pages}</span>
        <span className="row">{page > 1 ? <Link className="btn ghost sm" href={href(page - 1)}>‹ Sebelumnya</Link> : null}{page < pages ? <Link className="btn ghost sm" href={href(page + 1)}>Berikutnya ›</Link> : null}</span></div>
      {d.rows.some((r) => r.data_status === "cor") ? <Banner kind="warn">Ada koreksi dari keluarga yang menunggu diselesaikan.</Banner> : null}
    </div>
  );
}
