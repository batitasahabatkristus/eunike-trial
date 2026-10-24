import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { devLogin, googleLogin } from "./actions";
import { DEV_PERSONAS } from "@/lib/auth/dev";
import { getSession, landingFor } from "@/lib/auth/session";
import { devAuthEnabled, supabaseConfigured } from "@/lib/env";
import { appMessages } from "@/lib/i18n";
import { safeNext } from "@/lib/routes";
import { ROLE_LABEL } from "@/lib/roles";
import { FamilyForm, MagicForm } from "@/components/app/LoginForms";

export const metadata: Metadata = { title: "Masuk" };

export default async function Login({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const m = appMessages().login;
  const next = safeNext((await searchParams).next) ?? undefined;
  const session = await getSession();
  if (session) redirect(landingFor(session, next));
  const live = supabaseConfigured();

  return (
    <div className="theme-sk login">
      <main className="login-card">
        <Image className="login-logo" src="/assets/logo.png" alt="Sahabat Kristus" width={300} height={110} priority />
        <h1>{m.title}</h1>
        <p className="login-lead">{m.lead}</p>

        {live ? (
          <>
            <form action={googleLogin}>
              <input type="hidden" name="next" value={next ?? ""} />
              <button className="btn ghost block">{m.google}</button>
            </form>
            <div className="divider">{m.or}</div>
            <FamilyForm m={m} next={next} />
            <MagicForm m={m} next={next} />
          </>
        ) : null}

        {devAuthEnabled() ? (
          <section className="dev-box" aria-labelledby="dev-title">
            <h2 id="dev-title">{m.devTitle}</h2>
            <p className="login-lead" style={{ textAlign: "left", margin: 0 }}>{m.devHint}</p>
            <form action={devLogin} className="dev-grid">
              <input type="hidden" name="next" value={next ?? ""} />
              {DEV_PERSONAS.map((p) => (
                <button key={p.id} name="persona" value={p.id}>
                  {p.name}
                  <small>{p.roles.map((r) => ROLE_LABEL[r]).join(" · ")}</small>
                </button>
              ))}
            </form>
          </section>
        ) : null}

        <p style={{ textAlign: "center", marginTop: 18 }}><Link href="/">{m.backToSite}</Link></p>
      </main>
    </div>
  );
}
