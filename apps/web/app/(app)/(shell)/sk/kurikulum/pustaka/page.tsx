import type { Metadata } from "next";
import { guard } from "@/lib/auth/session";
import { asUser } from "@/lib/db";
import { assetUrl } from "@/lib/sk";
import { Empty } from "@/components/ui/bits";
import { PustakaUpload } from "@/components/app/PustakaUpload";

export const metadata: Metadata = { title: "Pustaka" };
const ICON = { image: "🖼", song: "🎵", video: "🎬", file: "📄" } as const;

/** KU-04: reusable images, songs and videos. */
export default async function Pustaka() {
  const session = await guard("/sk/kurikulum/pustaka");
  if (!session) return null;
  const items = await asUser(session.userId, (q) => q<{ id: string; kind: keyof typeof ICON; title: string; storage_path: string }>("select id, kind, title, storage_path from public.lesson_assets order by created_at desc"));
  return (
    <div className="col g14">
      <h1 className="h1" style={{ fontSize: 32 }}>Pustaka</h1>
      <PustakaUpload />
      {items.length === 0 ? <Empty>Pustaka masih kosong.</Empty> : (
        <div className="grid3">{items.map((a) => {
          const href = /^https?:/.test(a.storage_path) ? a.storage_path : assetUrl(a.storage_path);
          return <div key={a.id} className="card">{a.kind === "image" /* eslint-disable-next-line @next/next/no-img-element */ ? <img src={assetUrl(a.storage_path)} alt={a.title} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 12 }} loading="lazy" /> : <div className="photo" style={{ height: 110 }} aria-hidden="true">{ICON[a.kind]}</div>}
            <b className="purple">{a.title}</b>{a.kind !== "image" ? <div className="small mt8"><a href={href} target="_blank" rel="noreferrer">Buka tautan</a></div> : null}</div>;
        })}</div>
      )}
    </div>
  );
}
