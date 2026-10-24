import type { Metadata } from "next";
import Link from "next/link";
import { loadSkPage } from "@/lib/sk-page";
import { assetUrl } from "@/lib/sk";
import { idDate, Empty, ProgressBar } from "@/components/ui/bits";
import { FeedbackSheet } from "@/components/app/FeedbackSheet";
import { logout } from "@/app/(app)/masuk/actions";
import { relLabel } from "@/lib/family";

export const metadata: Metadata = { title: "Sahabat Kristus" };

const STATUS = {
  ok: { cls: "ok", text: "✓ Data sudah dikonfirmasi" },
  cor: { cls: "cor", text: "✈ Koreksi terkirim" },
  cek: { cls: "cek", text: "! Perlu dicek" },
} as const;

/** SK-01, SK-02. Default lesson is the latest published; unpublished lessons never appear. */
export default async function SkHome({ searchParams }: { searchParams: Promise<{ pel?: string }> }) {
  const sp = await searchParams;
  const ctx = await loadSkPage("/sk/keluarga", sp.pel, async (q, { family, lesson }) => {
    if (!family || !lesson) return { ayat: false, power: 0, shared: false };
    const [a, p, s] = await Promise.all([
      q.one<{ memorized: boolean }>("select memorized from public.ayat_progress where family_id = $1 and lesson_id = $2", [family.id, lesson.id]),
      q.one<{ n: number }>("select (select count(*) from unnest(items) x where x)::int n from public.power_progress where family_id = $1 and lesson_id = $2", [family.id, lesson.id]),
      q.one("select 1 from public.sharing_posts where family_id = $1 and lesson_id = $2 limit 1", [family.id, lesson.id]),
    ]);
    return { ayat: a?.memorized ?? false, power: p?.n ?? 0, shared: !!s };
  });
  if (!ctx) return null;
  const { session, family, lessons, lesson, progress, extra } = ctx;
  if (!family) return <Empty>Keluarga Anda belum terhubung. Hubungi admin SK.</Empty>;
  const me = family.members.find((m) => m.profile_id === session.userId);
  const total = lesson?.steps.length || 24;
  const complete = progress.done >= total;
  const pct = Math.round((progress.done / total) * 100);
  const st = STATUS[family.data_status];
  const q = lesson ? `?pel=${lesson.number}` : "";

  return (
    <div className="col g14">
      <div className="row between">
        <Link className="btn text sm" href="/beranda">‹ Eunike</Link>
        <Link className="chip sm" href="/pilih-peran">Sahabat Kristus ▾</Link>
      </div>
      <div className="famhdr">
        <div className="avatar" style={{ width: 54, height: 54 }} aria-hidden="true">{(me?.display_name ?? session.name).charAt(0)}</div>
        <div className="grow"><h1 className="nm" style={{ margin: 0 }}>Hai, {me?.display_name ?? session.name.split(" ")[0]}!</h1>
          <div className="small muted" style={{ fontWeight: 700 }}>{me ? relLabel(me.relation) : "Orang tua"}{family.children[0] ? ` · ${family.children.map((c) => c.name).join(", ")}` : ""}</div></div>
        <form action={logout}><button className="iconbtn" aria-label="Keluar">⎋</button></form>
      </div>
      <Link className={`datakel ${st.cls}`} href="/sk/keluarga/data"><span className="grow">{st.text}</span><span aria-hidden="true">›</span></Link>

      {!lesson ? <Empty>Belum ada pelajaran yang terbit.</Empty> : (
        <>
          <nav className="lstrip" aria-label="Pilih pelajaran">
            {lessons.map((l) => (
              <Link key={l.id} href={`/sk/keluarga?pel=${l.number}`} className={`lit${l.number === lesson.number ? " on" : ""}`} aria-current={l.number === lesson.number ? "true" : undefined}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(l.thumbnail_path)} alt="" width={110} height={68} loading="lazy" />
                <div className="n">Pel. {l.number}</div><div className="s">{l.short_title}</div>
              </Link>
            ))}
          </nav>
          <section className="hero" aria-labelledby="hero-t">
            <div className="top">
              <div className="grow">
                <div className="small muted" style={{ fontWeight: 700 }}>Pelajaran {lesson.number}{lesson.publish_at ? ` · ${idDate(lesson.publish_at)}` : ""}</div>
                <h2 className="ttl" id="hero-t">{lesson.title}</h2>
                <div className="small" style={{ fontWeight: 700 }}>{lesson.truth}</div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={assetUrl(lesson.thumbnail_path)} alt="" width={128} height={108} />
            </div>
            <div className="row between small mt12" style={{ fontWeight: 800, color: "var(--purple)" }}>
              <span>{complete ? "Pelajaran selesai ✓" : `Langkah ${progress.step + 1} dari ${total}`}</span><span>{pct}%</span>
            </div>
            <div className="mt8"><ProgressBar value={pct} label="Kemajuan pelajaran" /></div>
            <div className="mt12"><Link className="btn red block" href={`/sk/keluarga/alur${q}`}>{complete ? "Tinjau Pelajaran" : progress.done > 0 ? "Lanjutkan Pelajaran" : "Mulai Pelajaran"}</Link></div>
          </section>
          <section className="card" aria-labelledby="tj">
            <h2 className="h3" id="tj">Tujuan belajar</h2>
            <div className="small mt8">{lesson.goal || lesson.truth}</div>
            <div className="chips mt8">
              {([["Ayat", "/sk/keluarga/ayat", extra.ayat], ["Sharing", "/sk/keluarga/sharing", extra.shared], ["PoWeR", "/sk/keluarga/power", extra.power >= 3]] as const).map(([t, href, done]) => (
                <Link key={t} className={`chip${done ? " done" : ""}`} href={`${href}${q}`}>{done ? "✓" : "○"} {t}</Link>
              ))}
              <FeedbackSheet />
            </div>
          </section>
        </>
      )}
      <p className="center xs muted mt12">SK Batita membantu orang tua mendampingi anak belajar firman Tuhan di rumah dan di kelas.<br />
        <Link href="/id/privasi">Kebijakan Privasi</Link> · <Link href="/id/syarat">Ketentuan Layanan</Link></p>
    </div>
  );
}
