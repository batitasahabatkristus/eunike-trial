import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { Badge, Empty, type BadgeKind } from "@/components/ui/bits";
import { PublishEpkButton } from "@/components/app/AdminClients";

export const metadata: Metadata = { title: "Persetujuan EPK" };
const G = [["g", "Growth"], ["gl", "Gladness"], ["gr", "Gratitude"], ["go", "God"], ["gd", "Guidance"]] as const;
const P = [["a", "Pengamatan"], ["b", "Peneguhan"], ["c", "Percakapan"], ["d", "Pendampingan"]] as const;

interface Row { child_id: string; child: string; family: string; report_id: string | null; status: string | null; parent_sent_at: string | null; teacher_sent_at: string | null; parent_5g: Record<string, string> | null; teacher_5g: { note?: string } | null; p4: Record<string, string> | null }

/** AD-05: publish only when both sides have sent. Publishing notifies the parent. */
export default async function EpkAdmin({ searchParams }: { searchParams: Promise<{ anak?: string }> }) {
  const session = await guard("/sk/admin/epk");
  if (!session) return null;
  const rows = await asUser(session.userId, (q) => q<Row>(
    `select ch.id child_id, ch.name child, f.name family, e.id report_id, e.status::text, e.parent_sent_at::text, e.teacher_sent_at::text, e.parent_5g, e.teacher_5g, e.p4
       from public.children ch join public.families f on f.id = ch.family_id
       join public.sk_class_members m on m.child_id = ch.id join public.sk_classes c on c.id = m.class_id join public.semesters s on s.id = c.semester_id and s.active
       left join public.epk_reports e on e.child_id = ch.id and e.semester_id = s.id order by (e.status = 'ready') desc nulls last, ch.name`));
  const sp = await searchParams;
  const cur = rows.find((r) => r.child_id === sp.anak) ?? rows[0];
  const badge = (sent: string | null) => (sent ? <Badge kind="ok">Terkirim</Badge> : <Badge kind="warn">Belum</Badge>);
  const state = (r: Row): [string, BadgeKind] => r.status === "published" ? ["Terbit", "terbit"] : r.status === "ready" ? ["Siap ditinjau", "interview"] : ["Menunggu", "draft"];
  const ready = cur?.status === "ready";
  return (
    <div className="col g14">
      <h1 className="h1" style={{ fontSize: 32 }}>Persetujuan EPK</h1>
      {rows.length === 0 ? <Empty>Belum ada anak di kelas semester ini.</Empty> : (
        <div className="g21">
          <section className="card"><h2 className="h2 mb8">Daftar laporan</h2>
            <div className="tblwrap"><table className="tbl"><thead><tr><th scope="col">Anak</th><th scope="col">Orang tua</th><th scope="col">Guru</th><th scope="col">Status</th></tr></thead>
              <tbody>{rows.map((r) => <tr key={r.child_id} className={`rw${r.child_id === cur?.child_id ? " sel" : ""}`}><td><Link href={`/sk/admin/epk?anak=${r.child_id}`}><b className="purple">{r.child} {r.family}</b></Link></td><td>{badge(r.parent_sent_at)}</td><td>{badge(r.teacher_sent_at)}</td><td><Badge kind={state(r)[1]}>{state(r)[0]}</Badge></td></tr>)}</tbody></table></div></section>
          {cur ? (
            <section className="card" aria-label={`Laporan ${cur.child}`}><h2 className="h2">{cur.child} {cur.family}</h2>
              <div className="small mt8"><b>5G orang tua:</b> {cur.parent_sent_at ? G.map(([k, l]) => <span key={k} style={{ display: "block" }}>{l}: {cur.parent_5g?.[k] || "-"}</span>) : <span className="muted">belum dikirim</span>}
                <br /><b>5G guru:</b> {cur.teacher_sent_at ? cur.teacher_5g?.note : <span className="muted">belum dikirim</span>}
                <br /><b>4P:</b> {cur.teacher_sent_at ? P.map(([k, l]) => <span key={k} style={{ display: "block" }}>{l}: {cur.p4?.[k] || "-"}</span>) : <span className="muted">belum</span>}</div>
              {cur.status === "published" ? <div className="banner ok mt12">✓ Laporan sudah terbit.</div> : <PublishEpkButton reportId={cur.report_id} ready={ready} />}
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
