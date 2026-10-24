import type { Metadata } from "next";
import { guard } from "@/lib/auth/session";
import { logout } from "@/app/(app)/masuk/actions";
import { asUser } from "@/lib/db";
import { idDate } from "@/components/ui/bits";
import { loadFamily } from "@/lib/family";
import { SITE_LINKS } from "@/lib/site";
import { Avatar } from "@/components/ui/bits";
import { PinRow, ProfileRow } from "@/components/app/SettingsForms";

export const metadata: Metadata = { title: "Pengaturan" };

/** CO-08: profile, security (PIN), consent record, language, help, logout. */
export default async function Pengaturan() {
  const session = await guard("/beranda/pengaturan");
  if (!session) return null;
  const d = await asUser(session.userId, async (q) => ({
    profile: await q.one<{ full_name: string; phone: string | null }>("select full_name, phone from public.profiles where id = $1", [session.userId]),
    consent: await q.one<{ at: string; version: string }>("select at::text, version from public.consents where profile_id = $1 and type = 'privacy' order by at desc limit 1", [session.userId]),
    family: await loadFamily(q, session.userId),
  }));
  const hasPin = d.family ? await asUser(session.userId, async (q) => Boolean((await q.one<{ h: boolean }>("select public.has_family_pin($1) h", [d.family!.id]))?.h)) : false;
  return (
    <div className="page-narrow col g14">
      <h1 className="h1" style={{ fontSize: 30 }}>Pengaturan</h1>
      <div className="row"><Avatar text={session.name} /><div><b className="purple" style={{ fontSize: 19 }}>{d.profile?.full_name ?? session.name}</b><div className="small muted">{d.profile?.phone ?? "Nomor HP belum diisi"}</div></div></div>
      <section className="card" aria-labelledby="pf"><h2 className="h3" id="pf">👤 Profil</h2><ProfileRow name={d.profile?.full_name ?? ""} phone={d.profile?.phone ?? ""} /></section>
      {d.family ? <section className="card" aria-labelledby="sc"><h2 className="h3" id="sc">🛡 Keamanan</h2><PinRow familyId={d.family.id} hasPin={hasPin} /></section> : null}
      <section className="card" aria-labelledby="cn"><h2 className="h3" id="cn">✓ Persetujuan data</h2>
        <div className="kv"><span className="grow" style={{ fontWeight: 700 }}>{d.consent ? `Disetujui ${idDate(d.consent.at, { day: "numeric", month: "long", year: "numeric" })}` : "Belum ada catatan persetujuan"}</span></div></section>
      <section className="card" aria-labelledby="bh"><h2 className="h3" id="bh">🌐 Bahasa</h2><div className="kv"><span className="grow" style={{ fontWeight: 700 }}>Indonesia</span></div></section>
      <section className="card"><a className="kv" style={{ textDecoration: "none", color: "inherit", fontWeight: 700 }} href={`mailto:${SITE_LINKS.email}`}>❓ Bantuan <span className="grow" /><span className="purple" aria-hidden="true">›</span></a></section>
      <form action={logout} className="center"><button className="btn text" style={{ color: "var(--red)" }}>⎋ Keluar</button></form>
    </div>
  );
}
