import { notFound } from "next/navigation";
import { guard } from "@/lib/auth/session";
import { appMessages } from "@/lib/i18n";
import { findRoute } from "@/lib/roles";

/**
 * Every path in the PRD §8 access table resolves here until its module ships, already behind guard().
 * A module replaces this by adding its own page file at the same path.
 */
export default async function Placeholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = "/" + (await params).slug.join("/");
  const rule = findRoute(path);
  if (!rule) notFound();
  await guard(path);
  const m = appMessages().placeholder;
  return (
    <>
      <div className="page-title"><h1>{rule.title}</h1><span className="chip">{m.title}</span></div>
      <div className="card">
        <p>{m.body}</p>
        <p className="portal-note">{m.reqs}: {rule.reqs.join(", ")}</p>
      </div>
    </>
  );
}
