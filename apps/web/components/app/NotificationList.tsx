"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { markAllRead, openNotification } from "@/app/(app)/(shell)/beranda/actions";
import { useRun } from "@/components/ui/Toast";
import { idTime, idDate } from "@/components/ui/bits";

export interface Notif { id: string; title: string; body: string | null; action_url: string | null; read: boolean; at: string; group: string }

export function NotificationList({ items, filter }: { items: Notif[]; filter: "semua" | "belum" }) {
  const { run, pending } = useRun();
  const router = useRouter();
  void useSearchParams;
  const groups = ["Hari ini", "Kemarin", "Sebelumnya"].map((g) => [g, items.filter((n) => n.group === g)] as const).filter(([, l]) => l.length);
  return (
    <div className="col g14">
      <div className="row between wrap">
        <div className="chips">
          <Link className={`chip${filter === "semua" ? " on" : ""}`} href="/beranda/notifikasi">Semua</Link>
          <Link className={`chip${filter === "belum" ? " on" : ""}`} href="/beranda/notifikasi?f=belum">Belum dibaca</Link>
        </div>
        <button type="button" className="btn text sm" disabled={pending} onClick={() => run(() => markAllRead(), { after: () => router.refresh() })}>Tandai semua dibaca</button>
      </div>
      {groups.length === 0 ? <div className="ghostbox">Semua notifikasi sudah dibaca. 🎉</div> : groups.map(([g, list]) => (
        <section key={g} aria-label={g} className="col">
          <h2 className="h2">{g}</h2>
          {list.map((n) => (
            <form key={n.id} action={openNotification}>
              <input type="hidden" name="id" value={n.id} />
              <button className="evrow" style={n.read ? undefined : { borderColor: "var(--purple2)" }}>
                <div className="ic-c" aria-hidden="true">{n.title.includes("Laporan") ? "📄" : n.title.includes("Pelajaran") ? "📖" : n.title.includes("Absensi") ? "📅" : "🔔"}</div>
                <div className="grow">
                  <b className="purple">{n.title}</b>
                  <div className="small muted">{n.group === "Hari ini" ? `Hari ini ${idTime(n.at)}` : n.group === "Kemarin" ? `Kemarin ${idTime(n.at)}` : idDate(n.at)}</div>
                  {n.body && !n.read && /sekarang/i.test(n.body) ? <div className="mt8"><span className="btn purple sm" aria-hidden="true">{n.body}</span></div> : null}
                </div>
                {n.read ? null : <span aria-label="belum dibaca" style={{ width: 12, height: 12, borderRadius: "50%", background: "var(--accent)" }} />}
              </button>
            </form>
          ))}
        </section>
      ))}
    </div>
  );
}
