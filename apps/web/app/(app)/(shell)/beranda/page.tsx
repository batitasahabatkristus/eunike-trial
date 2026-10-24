import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { fmtYmd, greeting, hourJakarta, todayJakarta } from "@/lib/dates";
import { appMessages } from "@/lib/i18n";
import { loadFamily } from "@/lib/family";
import { navFor } from "@/lib/nav";
import type { Role } from "@/lib/roles";
import { Badge, Empty } from "@/components/ui/bits";

export const metadata: Metadata = { title: "Beranda" };

interface Tile { href: string; icon: string; label: string; hi?: boolean; badge?: number }

/** CO-01: greeting, "Hari ini", service tiles for the modules this person has a role for, announcements. */
export default async function Beranda() {
  const m = appMessages().home;
  const session = await guard("/beranda");
  if (!session) return null;
  const has = (...r: Role[]) => r.some((x) => session.roles.includes(x));
  const isParent = has("parent");

  const data = await asUser(session.userId, async (q) => {
    const family = isParent ? await loadFamily(q, session.userId) : null;
    const today = todayJakarta();
    const next = family?.klass
      ? await q.one<{ id: string; held_on: string; class_name: string; start_time: string; reported: boolean }>(
          `select mt.id, mt.held_on::text, c.name class_name, to_char(c.start_time, 'HH24.MI') start_time,
                  coalesce(a.family_report is not null, false) reported
             from public.sk_meetings mt join public.sk_classes c on c.id = mt.class_id
             left join public.sk_attendance a on a.meeting_id = mt.id and a.family_id = $1 and a.kind = 'family'
            where mt.class_id = $2 and mt.held_on >= $3 order by mt.held_on limit 1`, [family.id, family.klass.id, today])
      : null;
    const unread = Number((await q.one<{ n: string }>("select count(*) n from public.notifications where profile_id = $1 and read_at is null", [session.userId]))?.n ?? 0);
    return { family, next, unread, today };
  });

  const first = session.name.split(" ")[0];
  const tiles: Tile[] = [];
  if (isParent) {
    tiles.push({ href: "/sk/keluarga", icon: "🧒", label: "Sahabat Kristus", hi: true });
    tiles.push({ href: "/beranda/jadwal", icon: "📅", label: "Jadwal" });
    tiles.push({ href: "/beranda/keluarga", icon: "👨‍👩‍👧", label: "Keluarga Saya" });
    if (has("event_participant", "event_committee", "event_admin")) tiles.push({ href: "/event/peserta", icon: "⭐", label: "Acara Berikutnya" });
    if (has("ktb_member", "ktb_facilitator", "ktb_speaker")) tiles.push({ href: "/ktb/kelompok", icon: "📖", label: "KTB" });
    tiles.push({ href: "/beranda/notifikasi", icon: "🔔", label: "Notifikasi", badge: data.unread });
    tiles.push({ href: "/beranda/laporan", icon: "📄", label: "Laporan Semester" });
    tiles.push({ href: "/beranda/parenting", icon: "🧸", label: "Parenting" });
  } else {
    for (const n of navFor(session.roles, session.active).filter((i) => i.module !== "home")) tiles.push({ href: n.href, icon: n.icon, label: n.label });
  }

  return (
    <div className="page-narrow">
      <h1 className="h1" style={{ fontSize: 30 }}>{greeting(hourJakarta())}, {first}!</h1>
      <p className="muted" style={{ fontWeight: 700, margin: "4px 0 16px" }}>Mari bertumbuh bersama keluarga.</p>

      {isParent ? (
        <section className="card" aria-labelledby="today">
          <h2 className="h2" id="today">{m.today}</h2>
          <div className="small muted">{fmtYmd(data.today)}</div>
          {data.next ? (
            <Link href="/beranda/jadwal" className="row mt8" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="ic-c">📅</div>
              <div className="grow"><b className="purple">Pertemuan Sahabat Kristus</b><div className="small muted">{data.next.start_time} · Kelas {data.next.class_name} · {fmtYmd(data.next.held_on, { weekday: "short", day: "numeric", month: "short" })}</div></div>
              {data.next.reported ? <Badge kind="ok">Sudah isi absensi</Badge> : <Badge kind="warn">Belum isi absensi</Badge>}
            </Link>
          ) : <p className="muted small mt8">{m.todayEmpty}</p>}
        </section>
      ) : null}

      <section aria-labelledby="svc">
        <h2 className="h2 mt16 mb8" id="svc">{m.services}</h2>
        {tiles.length === 0 ? <Empty>{m.noServices}</Empty> : (
          <div className="tiles2">
            {tiles.map((t) => (
              <Link key={t.href} href={t.href} className={`tile${t.hi ? " hi" : ""}`}>
                <span className="ic" aria-hidden="true">{t.icon}</span><span className="grow">{t.label}</span>
                {t.badge ? <span className="bd" aria-label={`${t.badge} belum dibaca`}>{t.badge}</span> : null}
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="card lilac mt12" aria-labelledby="ann">
        <b className="purple" id="ann">{m.announcements}</b>
        <div className="small mt8 muted">{m.announcementsEmpty}</div>
      </section>
    </div>
  );
}
