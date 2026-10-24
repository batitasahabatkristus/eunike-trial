import type { Metadata } from "next";
import Link from "next/link";
import { guard } from "@/lib/auth/session";
import { appMessages, fmt } from "@/lib/i18n";
import { navFor } from "@/lib/nav";

export const metadata: Metadata = { title: "Beranda" };

/** CO-01 skeleton: greeting + tiles for modules the person has a role for. Cards fill in as modules ship. */
export default async function Beranda() {
  const m = appMessages().home;
  const session = await guard("/beranda");
  if (!session) return null;
  const tiles = navFor(session.roles, session.active).filter((i) => i.module !== "home");
  return (
    <>
      <div className="page-title"><h1>{fmt(m.greeting, { name: session.name })}</h1></div>
      <section aria-labelledby="today" className="card" style={{ marginBottom: 22 }}>
        <h2 id="today" style={{ fontSize: "1.2rem" }}>{m.today}</h2>
        <p className="empty-state" style={{ padding: 8 }}>{m.todayEmpty}</p>
      </section>
      <section aria-labelledby="svc">
        <h2 id="svc" style={{ fontSize: "1.2rem" }}>{m.services}</h2>
        {tiles.length === 0 ? <p className="empty-state">{m.noServices}</p> : (
          <div className="tiles">
            {tiles.map((t) => (
              <Link className="tile" key={t.module} href={t.href}><span className="ic" aria-hidden="true">{t.icon}</span>{t.label}</Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
