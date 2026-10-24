import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { loadFamily } from "@/lib/family";
import { pinGateOpen } from "@/lib/pin-gate";
import { Banner } from "@/components/ui/bits";
import { PinGate } from "@/components/app/ReportClients";

export const metadata: Metadata = { title: "Laporan semester" };
const G = [["g", "Growth"], ["gl", "Gladness"], ["gr", "Gratitude"], ["go", "God"], ["gd", "Guidance"]] as const;
const P = [["a", "Pengamatan"], ["b", "Peneguhan"], ["c", "Percakapan"], ["d", "Pendampingan"]] as const;

/** The published report: parent 5G and teacher 4P. Behind the family PIN (15 minutes per device). */
export default async function Terbit({ params }: { params: Promise<{ child: string }> }) {
  const { child } = await params;
  const session = await guard(`/beranda/laporan/${child}`);
  if (!session || !z.uuid().safeParse(child).success) return notFound();
  const d = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    const kid = family?.children.find((c) => c.id === child);
    if (!family || !kid) return null;
    const report = await q.one<{ status: string; parent_5g: Record<string, string> | null; teacher_5g: { note?: string } | null; p4: Record<string, string> | null }>(
      "select status::text, parent_5g, teacher_5g, p4 from public.v_epk_family where child_id = $1 and semester_id = (select id from public.semesters where active)", [child]);
    const hasPin = (await q.one<{ h: boolean }>("select public.has_family_pin($1) h", [family.id]))?.h === true;
    const sem = await q.one<{ label: string }>("select label from public.semesters where active");
    return { family, kid, report, hasPin, sem };
  });
  if (!d) return notFound();
  const open = d.report?.status === "published" && (await pinGateOpen(d.family.id, session.userId));
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/beranda/laporan" aria-label="Kembali">‹</Link><h1 className="t">Laporan semester {d.kid.name}<small>Semester {d.sem?.label}</small></h1></div>
      {d.report?.status !== "published" ? <Banner kind="warn">Laporan belum terbit. Admin masih meninjau.</Banner>
        : !open ? <PinGate familyId={d.family.id} hasPin={d.hasPin} />
        : (
          <>
            <section className="card"><h2 className="h2">Refleksi keluarga (5G)</h2><div className="small mt8">{G.map(([k, l]) => <p key={k} style={{ margin: "0 0 6px" }}><b>{l}:</b> {d.report?.parent_5g?.[k] ?? "-"}</p>)}</div></section>
            <section className="card lilac"><h2 className="h2">Catatan guru (4P)</h2><div className="small mt8">{P.map(([k, l]) => <p key={k} style={{ margin: "0 0 6px" }}><b>{l}:</b> {d.report?.p4?.[k] ?? "-"}</p>)}</div></section>
            <a className="btn ghost block" href={`/beranda/laporan/${child}/pdf`}>🖨 Cetak PDF</a>
          </>
        )}
    </div>
  );
}
