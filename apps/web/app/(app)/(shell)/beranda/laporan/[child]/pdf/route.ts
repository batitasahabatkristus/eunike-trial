import { z } from "zod";
import { getSession } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { loadFamily } from "@/lib/family";
import { textReport } from "@/lib/pdf";
import { pinGateOpen } from "@/lib/pin-gate";

const G = [["g", "Growth"], ["gl", "Gladness"], ["gr", "Gratitude"], ["go", "God"], ["gd", "Guidance"]] as const;
const P = [["a", "Pengamatan"], ["b", "Peneguhan"], ["c", "Percakapan"], ["d", "Pendampingan"]] as const;

/** PDF export of a published report. Same checks as the page: signed in, own child, published, PIN gate open. */
export async function GET(_req: Request, { params }: { params: Promise<{ child: string }> }) {
  const { child } = await params;
  const session = await getSession();
  if (!session || !session.roles.includes("parent") || !z.uuid().safeParse(child).success) return new Response("Forbidden", { status: 403 });
  const d = await asUser(session.userId, async (q) => {
    const family = await loadFamily(q, session.userId);
    const kid = family?.children.find((c) => c.id === child);
    if (!family || !kid) return null;
    const r = await q.one<{ parent_5g: Record<string, string> | null; p4: Record<string, string> | null }>(
      "select parent_5g, p4 from public.v_epk_family where child_id = $1 and status = 'published' and semester_id = (select id from public.semesters where active)", [child]);
    const sem = (await q.one<{ label: string }>("select label from public.semesters where active"))?.label ?? "";
    return r ? { family, kid, r, sem } : null;
  });
  if (!d || !(await pinGateOpen(d.family.id, session.userId))) return new Response("Forbidden", { status: 403 });
  const pdf = await textReport(`Laporan semester ${d.kid.name}`, `Semester ${d.sem} - Keluarga ${d.family.name}`, [
    { heading: "Refleksi keluarga (5G)", paragraphs: G.map(([k, l]) => ({ label: l, text: d.r.parent_5g?.[k] ?? "-" })) },
    { heading: "Catatan guru (4P)", paragraphs: P.map(([k, l]) => ({ label: l, text: d.r.p4?.[k] ?? "-" })) },
  ]);
  return new Response(Buffer.from(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="laporan-${d.kid.name}.pdf"`, "Cache-Control": "private, no-store" } });
}
