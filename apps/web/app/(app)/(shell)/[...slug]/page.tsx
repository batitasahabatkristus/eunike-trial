import { notFound } from "next/navigation";
import { guard, getSession } from "@/lib/auth/session";
import { devAuthEnabled } from "@/lib/env";
import { appMessages } from "@/lib/i18n";
import { mockFor } from "@/lib/mock/registry";
import { findRoute } from "@/lib/roles";
import { MockScreen } from "@/components/mock/MockScreen";

/**
 * Every path in the PRD §8 access table resolves here until its module ships, already behind guard().
 * On previews (fake data only) a clickable MOCKUP replaces the "coming soon" card. A module replaces this by adding its own page file.
 */
export default async function Placeholder({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = "/" + (await params).slug.join("/");
  const rule = findRoute(path);
  if (!rule) notFound();
  await guard(path);
  const m = appMessages().placeholder;
  if (devAuthEnabled()) {
    const session = await getSession();
    const screen = mockFor(path, session?.active ? [session.active] : session?.roles ?? []);
    if (screen) return <MockScreen screen={screen} banner={m.mockBanner} footer={m.reqs} />;
  }
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
