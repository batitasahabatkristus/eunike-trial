import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { getSession } from "@/lib/auth/session";
import { asUser, dbConfigured } from "@/lib/db";
import { supabaseConfigured } from "@/lib/env";
import { loadFamily } from "@/lib/family";
import { ALLOWED_MIME, ASSET_MAX_BYTES, ASSET_MIME, ASSET_RE, MAX_BYTES, PATH_RE, localRoot } from "@/lib/storage";

/** Local-only upload target for dev and tests. Deployed environments upload straight to Supabase Storage. */
export async function PUT(req: Request) {
  if (supabaseConfigured() || process.env.NODE_ENV === "production") return new Response("Not found", { status: 404 });
  const session = await getSession();
  if (!session || !dbConfigured()) return new Response("Forbidden", { status: 403 });
  const sp = new URL(req.url).searchParams;
  const rel = sp.get("path") ?? "";
  const bucket = sp.get("bucket") === "lesson-assets" ? "lesson-assets" : "memory-markers";
  if (!PATH_RE.test(rel) && !ASSET_RE.test(rel)) return new Response("Bad path", { status: 400 });
  const mime = req.headers.get("content-type") ?? "";
  let limit = MAX_BYTES;
  if (bucket === "memory-markers") {
    const family = await asUser(session.userId, (q) => loadFamily(q, session.userId));
    if (!family || !rel.startsWith(`${family.id}/`) || !PATH_RE.test(rel)) return new Response("Forbidden", { status: 403 });
    if (!ALLOWED_MIME.test(mime)) return new Response("Unsupported type", { status: 415 });
  } else {
    if (!session.roles.some((r) => r === "sk_kurikulum" || r === "sk_admin") || !ASSET_RE.test(rel)) return new Response("Forbidden", { status: 403 });
    if (!ASSET_MIME.test(mime)) return new Response("Unsupported type", { status: 415 });
    limit = ASSET_MAX_BYTES;
  }
  const declared = Number(req.headers.get("content-length") ?? 0);
  if (declared > limit) return new Response("Too large", { status: 413 });
  if (!req.body) return new Response("Empty", { status: 400 });

  const dest = path.join(localRoot(), bucket, rel);
  await mkdir(path.dirname(dest), { recursive: true });
  let n = 0;
  const cap = new Transform({ transform(chunk, _e, cb) { n += chunk.length; n > limit ? cb(new Error("too large")) : cb(null, chunk); } });
  try {
    await pipeline(Readable.fromWeb(req.body as never), cap, createWriteStream(dest));
  } catch {
    await rm(dest, { force: true });
    return new Response("Too large", { status: 413 });
  }
  return Response.json({ ok: true });
}
