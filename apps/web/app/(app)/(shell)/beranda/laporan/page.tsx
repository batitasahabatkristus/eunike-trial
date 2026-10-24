import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { loadFamily } from "@/lib/family";
import { Banner, Empty } from "@/components/ui/bits";
import { ParentEpkForm } from "@/components/app/ReportClients";

export const metadata: Metadata = { title: "Laporan semester" };

/** SK-12: parent fills 5G (Growth, Gladness, Gratitude, God, Guidance). The published report opens with the family PIN. */
export default async function Laporan() {
  const session = await guard("/beranda/laporan");
  if (!session) return null;
  const d = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    const sem = await q.one<{ id: string; label: string }>("select id, label from public.semesters where active");
    const reports = family && sem ? await q<{ child_id: string; status: string; parent_5g: Record<string, string> | null }>("select child_id, status::text, parent_5g from public.v_epk_family where semester_id = $1", [sem.id]) : [];
    return { family, sem, reports };
  });
  if (!d.family || !d.sem) return <div className="page-narrow"><Empty>Laporan semester belum tersedia.</Empty></div>;
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda" aria-label="Kembali">‹</Link><h1 className="t">Laporan semester<small>Semester {d.sem.label}</small></h1></div>
      {d.family.children.map((c) => {
        const r = d.reports.find((x) => x.child_id === c.id);
        return (
          <section key={c.id} className="col g14" aria-label={`Laporan ${c.name}`}>
            <h2 className="h2">{c.name}</h2>
            {r?.status === "published" ? (<><Banner kind="ok">✓ Laporan sudah terbit.</Banner><Link className="btn red block" href={`/beranda/laporan/${c.id}`}>Lihat laporan {c.name}</Link></>)
              : r?.status === "parent_sent" || r?.status === "teacher_sent" || r?.status === "ready" ? <Banner kind="ok">✓ Refleksi 5G terkirim. Menunggu {r.status === "parent_sent" ? "refleksi guru dan " : ""}persetujuan admin.</Banner>
              : <Banner kind="info">🔒 Isi refleksi 5G. Laporan dibuka dengan PIN keluarga.</Banner>}
            <ParentEpkForm childId={c.id} initial={r?.parent_5g ?? null} locked={r?.status === "published"} />
          </section>
        );
      })}
    </div>
  );
}
