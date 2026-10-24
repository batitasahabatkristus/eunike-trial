import type { Metadata } from "next";
import Link from "next/link";
import { loadGuru } from "@/lib/guru";
import { Badge, Empty } from "@/components/ui/bits";
import { ClassSwitch } from "@/components/app/ClassSwitch";
import { TeacherReflection } from "@/components/app/GuruClients";

export const metadata: Metadata = { title: "Refleksi 5G dan 4P" };
const G = [["g", "Growth"], ["gl", "Gladness"], ["gr", "Gratitude"], ["go", "God"], ["gd", "Guidance"]] as const;

/** GU-05: sees the parent's 5G once sent; writes the teacher reflection and 4P; sends to admin. */
export default async function Refleksi({ searchParams }: { searchParams: Promise<{ k?: string; anak?: string }> }) {
  const sp = await searchParams;
  const ctx = await loadGuru("/sk/guru/refleksi", sp.k, async (q, klass) => {
    if (!klass) return null;
    const kids = await q<{ id: string; name: string; family: string; status: string | null }>(
      `select ch.id, ch.name, f.name family, (select e.status::text from public.epk_reports e where e.child_id = ch.id and e.semester_id = (select id from public.semesters where active)) status
         from public.sk_class_members m join public.children ch on ch.id = m.child_id join public.families f on f.id = m.family_id where m.class_id = $1 order by ch.name`, [klass.id]);
    const kid = kids.find((c) => c.id === sp.anak) ?? kids[0];
    const rep = kid ? await q.one<{ parent_5g: Record<string, string> | null; teacher_5g: { note?: string } | null; p4: Record<string, string> | null; parent_sent_at: string | null; teacher_sent_at: string | null; status: string }>(
      "select parent_5g, teacher_5g, p4, parent_sent_at::text, teacher_sent_at::text, status::text from public.epk_reports where child_id = $1 and semester_id = (select id from public.semesters where active)", [kid.id]) : null;
    const sem = await q.one<{ label: string }>("select label from public.semesters where active");
    return { kids, kid, rep, sem };
  });
  if (!ctx) return null;
  const { classes, klass, data } = ctx;
  if (!klass || !data) return <Empty>Anda belum ditugaskan ke kelas mana pun.</Empty>;
  const { kids, kid, rep, sem } = data;
  const kk = classes.length > 1 ? `&k=${encodeURIComponent(klass.name)}` : "";
  const locked = rep?.status === "published";
  return (
    <div className="page-narrow col g14">
      <div className="hdr"><Link className="back" href="/sk/guru" aria-label="Kembali">‹</Link><h1 className="t">Refleksi guru dan 4P<small>{kid ? `${kid.name} · Semester ${sem?.label}` : ""}</small></h1></div>
      <ClassSwitch classes={classes} current={klass} base="/sk/guru/refleksi" />
      <nav className="chips nowrap" aria-label="Pilih anak">{kids.map((c) => <Link key={c.id} className={`chip${c.id === kid?.id ? " on" : ""}`} href={`/sk/guru/refleksi?anak=${c.id}${kk}`}>{c.name}{c.status === "ready" || c.status === "published" ? " ✓" : ""}</Link>)}</nav>
      {!kid ? <Empty>Belum ada anak di kelas ini.</Empty> : (
        <>
          <section className={`card ${rep?.parent_sent_at ? "mint" : "peach"}`}><b className="purple">Refleksi orang tua</b>
            <div className="small mt8">{rep?.parent_sent_at ? G.map(([k, l]) => <p key={k} style={{ margin: "0 0 4px" }}><b>{l}:</b> {rep.parent_5g?.[k] || "-"}</p>) : "Orang tua belum mengirim refleksi 5G."}</div></section>
          {locked ? <div className="banner ok">✓ Laporan sudah terbit. Refleksi tidak dapat diubah.</div> : <TeacherReflection key={kid.id} childId={kid.id} initialNote={rep?.teacher_5g?.note ?? ""} initialP4={{ a: rep?.p4?.a ?? "", b: rep?.p4?.b ?? "", c: rep?.p4?.c ?? "", d: rep?.p4?.d ?? "" }} sent={!!rep?.teacher_sent_at} />}
          {rep?.teacher_sent_at && !locked ? <Badge kind="ok">Terkirim ke admin</Badge> : null}
        </>
      )}
    </div>
  );
}
