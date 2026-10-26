import Link from "next/link";
import { logout } from "../masuk/actions";
import { getSession } from "@/lib/auth/session";
import { asUser, dbConfigured } from "@/lib/db";
import { appMessages } from "@/lib/i18n";
import { bottomNavsFor, navFor, subNavsFor } from "@/lib/nav";
import { routes } from "@/lib/routes";
import { ROLE_LABEL, decide } from "@/lib/roles";
import { BottomNav, SideNav } from "@/components/app/NavLinks";
import { BrandMark } from "@/components/site/BrandMark";
import { ToastProvider } from "@/components/ui/Toast";
import { MockProvider } from "@/components/mock/MockProvider";

/** Pages inside decide their own access (see guard()); the shell only draws chrome for whoever is signed in. */
export default async function Shell({ children }: { children: React.ReactNode }) {
  const m = appMessages();
  const session = await getSession();
  if (!session) return <ToastProvider><MockProvider><div className="content theme-eu">{children}</div></MockProvider></ToastProvider>;

  const items = navFor(session.roles, session.active);
  const role = session.active ?? session.roles[0];
  const canNotify = decide("/beranda/notifikasi", session.roles, session.active) === "allow";
  const unread = canNotify && dbConfigured()
    ? await asUser(session.userId, async (q) => Number((await q.one<{ n: string }>("select count(*) n from public.notifications where profile_id = $1 and read_at is null", [session.userId]))?.n ?? 0))
    : 0;
  return (
    <ToastProvider>
      <MockProvider>
      <div className="shell theme-eu">
        <aside className="side">
          <Link className="brand" href={routes.beranda}><BrandMark /> {m.brand}</Link>
          <SideNav items={items} subs={subNavsFor(session.roles, session.active)} label={m.shell.nav} />
          <div className="side-me">
            <span className="avatar" aria-hidden="true">{session.name.charAt(0).toUpperCase()}</span>
            <span className="me-name">{session.name}<small>{role ? ROLE_LABEL[role] : ""}</small></span>
          </div>
        </aside>
        <div className="main-col">
          <header className="topbar">
            {canNotify ? (
              <form action="/beranda/cari" role="search" className="search">
                <input className="inp" type="search" name="q" placeholder={m.shell.search} aria-label={m.shell.search} />
              </form>
            ) : null}
            <span className="spacer" />
            {session.roles.length > 1 ? (
              <Link className="role-chip" href={routes.pickRole} aria-label={m.shell.roleSwitch}>
                {m.shell.activeRole}: {session.active ? ROLE_LABEL[session.active] : "—"}
              </Link>
            ) : null}
            {canNotify ? (
              <Link className="iconbtn" href="/beranda/notifikasi" aria-label={`${m.shell.notifications}${unread ? `, ${unread} belum dibaca` : ""}`}>
                🔔{unread ? <span className="dot">{unread}</span> : null}
              </Link>
            ) : null}
            <form action={logout}><button className="btn text">{m.shell.logout}</button></form>
          </header>
          <main className="content">{children}</main>
        </div>
        <BottomNav {...bottomNavsFor(session.roles, session.active)} label={m.shell.nav} />
      </div>
      </MockProvider>
    </ToastProvider>
  );
}
