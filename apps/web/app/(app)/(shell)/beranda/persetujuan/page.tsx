import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CONSENT_PATH, CONSENT_VERSION, guard } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { appMessages, getMessages } from "@/lib/i18n";
import { safeNext } from "@/lib/routes";
import { landingFor } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Persetujuan" };

async function accept(form: FormData) {
  "use server";
  const session = await guard(CONSENT_PATH);
  if (!session || form.get("agree") !== "on") redirect(CONSENT_PATH);
  // RLS lets a person insert only their own consent row.
  await (await createClient()).from("consents").insert({ profile_id: session.userId, type: "privacy", version: CONSENT_VERSION });
  redirect(landingFor(session, safeNext(form.get("next"))));
}

export default async function Consent({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  await guard(CONSENT_PATH);
  const next = safeNext((await searchParams).next);
  const doc = getMessages("id").legal.privacy;
  const c = appMessages().consent;
  return (
    <div className="card">
      <h1 style={{ fontSize: "1.6rem" }}>{doc.title}</h1>
      <p>{doc.intro}</p>
      {doc.sections.map((s) => (<section key={s.h}><h2 style={{ fontSize: "1.05rem" }}>{s.h}</h2><p>{s.p}</p></section>))}
      <form action={accept}>
        <input type="hidden" name="next" value={next ?? ""} />
        <label style={{ display: "flex", gap: 10, alignItems: "center", minHeight: 44, fontWeight: 700 }}>
          <input type="checkbox" name="agree" required style={{ width: 22, height: 22 }} /> {c.agree}
        </label>
        <button className="btn btn-primary" style={{ marginTop: 12 }}>{c.submit}</button>
      </form>
    </div>
  );
}
