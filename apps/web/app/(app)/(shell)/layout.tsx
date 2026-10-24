import Link from "next/link";
import { logout } from "../masuk/actions";
import { getSession } from "@/lib/auth/session";
import { appMessages } from "@/lib/i18n";
import { navFor } from "@/lib/nav";
import { routes } from "@/lib/routes";
import { ROLE_LABEL } from "@/lib/roles";
import { BottomNav, SideNav } from "@/components/app/NavLinks";
import { BrandMark } from "@/components/site/BrandMark";

/** Pages inside decide their own access (see guard()); the shell only draws chrome for whoever is signed in. */
export default async function Shell({ children }: { children: React.ReactNode }) {
  const m = appMessages();
  const session = await getSession();
  if (!session) return <div className="content">{children}</div>;

  const items = navFor(session.roles, session.active);
  const role = session.active ?? session.roles[0];
  return (
    <div className="shell">
      <aside className="side">
        <Link className="brand" href={routes.beranda}><BrandMark /> {m.brand}</Link>
        <SideNav items={items} label={m.shell.nav} />
        <div className="side-me">
          <span className="avatar" aria-hidden="true">{session.name.charAt(0).toUpperCase()}</span>
          <span className="me-name">{session.name}<small>{role ? ROLE_LABEL[role] : ""}</small></span>
        </div>
      </aside>
      <div className="main-col">
        <header className="topbar">
          <input className="input search" type="search" placeholder={m.shell.search} aria-label={m.shell.search} disabled />
          <span className="spacer" />
          {session.roles.length > 1 ? (
            <Link className="role-chip" href={routes.pickRole} aria-label={m.shell.roleSwitch}>
              {m.shell.activeRole}: {session.active ? ROLE_LABEL[session.active] : "—"}
            </Link>
          ) : null}
          <span className="icon-btn" role="img" aria-label={m.shell.notifications}>🔔</span>
          <form action={logout}><button className="btn btn-text">{m.shell.logout}</button></form>
        </header>
        <main className="content">{children}</main>
      </div>
      <BottomNav items={items} label={m.shell.nav} />
    </div>
  );
}
