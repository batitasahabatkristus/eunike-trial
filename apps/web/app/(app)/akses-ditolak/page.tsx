import type { Metadata } from "next";
import Link from "next/link";
import { getSession, landingFor } from "@/lib/auth/session";
import { appMessages } from "@/lib/i18n";
import { routes } from "@/lib/routes";

export const metadata: Metadata = { title: "Akses ditolak" };

export default async function Denied() {
  const m = appMessages().denied;
  const session = await getSession();
  const home = session ? landingFor(session) : routes.login;
  return (
    <div className="center-page">
      <main className="card center-card" role="alert">
        <h1>{m.title}</h1>
        <p>{m.body}</p>
        <Link className="btn red" href={home}>{session ? m.home : m.login}</Link>
      </main>
    </div>
  );
}
