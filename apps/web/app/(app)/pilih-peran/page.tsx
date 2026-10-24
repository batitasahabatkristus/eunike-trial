import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { chooseRole } from "../masuk/actions";
import { getSession, landingFor } from "@/lib/auth/session";
import { appMessages } from "@/lib/i18n";
import { routes, safeNext } from "@/lib/routes";
import { ROLE_LABEL } from "@/lib/roles";

export const metadata: Metadata = { title: "Masuk sebagai" };

/** PRD §7.3 "Masuk sebagai". Shown when a person holds several roles and has not chosen yet. */
export default async function PickRole({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const m = appMessages().pickRole;
  const next = safeNext((await searchParams).next);
  const session = await getSession();
  if (!session) redirect(routes.login);
  if (session.roles.length <= 1) redirect(landingFor(session, next));
  return (
    <div className="center-page">
      <main className="card center-card">
        <h1>{m.title}</h1>
        <p>{m.lead}</p>
        <form action={chooseRole} className="role-list">
          <input type="hidden" name="next" value={next ?? ""} />
          {session.roles.map((r) => (
            <button key={r} name="role" value={r}>{ROLE_LABEL[r]}</button>
          ))}
        </form>
        <p className="portal-note">{m.note}</p>
      </main>
    </div>
  );
}
