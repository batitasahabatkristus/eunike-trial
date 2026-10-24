import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { ageText, Badge, idDate } from "@/components/ui/bits";
import { loadFamily, relLabel } from "@/lib/family";
import { PrivacyToggle } from "@/components/app/PrivacyToggle";

export const metadata: Metadata = { title: "Keluarga Saya" };

/** CO-03. The timeline comes from real participation history, and hides when the family turns it off. */
export default async function Keluarga() {
  const session = await guard("/beranda/keluarga");
  if (!session) return null;
  const { family, events } = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    if (!family) return { family, events: [] as TL[] };
    const rows = await q<TL>(
      `select 'Bergabung dengan Sahabat Kristus' title, '👤' icon, created_at::text at from public.families where id = $1
       union all select 'Kelas ' || c.name, '📖', m.joined_at::text from public.sk_class_members m join public.sk_classes c on c.id = m.class_id where m.family_id = $1
       union all select 'Pelajaran ' || l.number || ' selesai', '🏅', lp.updated_at::text from public.lesson_progress lp join public.lessons l on l.id = lp.lesson_id where lp.family_id = $1 and lp.done_steps >= 24
       union all select 'Laporan semester ' || ch.name || ' terbit', '📄', e.published_at::text from public.epk_reports e join public.children ch on ch.id = e.child_id where e.family_id = $1 and e.status = 'published'
       order by at`, [family.id]);
    return { family, events: rows };
  });
  if (!family) return <div className="page-narrow"><div className="ghostbox">Keluarga Anda belum terhubung. Hubungi admin SK.</div></div>;
  const kind = (r: string) => (r === "papa" ? "interview" : r === "mama" ? "need" : "pending") as "interview" | "need" | "pending";
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda" aria-label="Kembali">‹</Link><h1 className="t">Keluarga {family.name}</h1></div>
      <section className="card row" aria-label="Anggota keluarga">
        <div className="photo" style={{ width: 96, height: 96, flex: "none" }} aria-hidden="true">FOTO</div>
        <div className="col g6 grow">
          {family.members.map((m) => <Badge key={m.id} kind={kind(m.relation)}>{relLabel(m.relation)} {m.display_name}</Badge>)}
          {family.children.map((c) => <Badge key={c.id} kind="pending">{c.name} ({ageText(c.dob)})</Badge>)}
        </div>
      </section>
      <div className="row">
        <Link className="btn ghost sm grow" href="/beranda/keluarga/kartu">Kartu anggota</Link>
        <Link className="btn ghost sm grow" href="/beranda/keluarga/anak-grup">Daftarkan anak</Link>
      </div>
      <section className="card" aria-labelledby="pj">
        <h2 className="h2" id="pj">Perjalanan keluarga</h2>
        <div className="tl mt12">
          {family.privacy_timeline ? events.map((e, i) => (
            <div key={i} className="s done"><div className="dot" aria-hidden="true">{e.icon}</div>
              <div className="card" style={{ padding: "9px 12px", flex: 1 }}><div className="small muted">{idDate(e.at, { month: "long", year: "numeric" })}</div><b className="purple">{e.title}</b></div></div>
          )) : <div className="ghostbox">Perjalanan keluarga disembunyikan.<br />Hanya jumlah tanpa nama yang dihitung untuk laporan.</div>}
        </div>
      </section>
      <PrivacyToggle familyId={family.id} on={family.privacy_timeline} />
    </div>
  );
}
interface TL { title: string; icon: string; at: string }
