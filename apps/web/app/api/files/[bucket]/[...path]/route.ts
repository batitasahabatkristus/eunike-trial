import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { getSession } from "@/lib/auth/session";
import { asUser, dbConfigured } from "@/lib/db";
import { supabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import { BUCKETS, localRoot, type Bucket } from "@/lib/storage";

const TYPES: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif", mp4: "video/mp4", mov: "video/quicktime", webm: "video/webm" };

/**
 * Private files. Access is decided by RLS on the database row that points at the file (never by the path alone);
 * Supabase serves a 15-minute signed URL, local dev streams from disk.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ bucket: string; path: string[] }> }) {
  const { bucket, path: parts } = await params;
  const rel = parts.join("/");
  if (!(BUCKETS as readonly string[]).includes(bucket) || rel.includes("..") || rel.startsWith("/")) return new Response("Not found", { status: 404 });
  const session = await getSession();
  if (!session || !dbConfigured()) return new Response("Forbidden", { status: 403 });

  const allowed = await asUser(session.userId, async (q) => {
    if ((bucket as Bucket) === "memory-markers") return Boolean(await q.one("select 1 from public.memory_marker_files where storage_path = $1", [rel]));
    // lesson art is visible to anyone who can read a published lesson that uses it, and to Kurikulum/admin for drafts
    return Boolean(await q.one("select 1 from public.lessons l where l.thumbnail_path = $1 union all select 1 from public.lesson_scenes s join public.lessons l on l.id = s.lesson_id where s.image_path = $1 union all select 1 from public.lesson_assets a where a.storage_path = $1 limit 1", [rel]));
  });
  if (!allowed) return new Response("Not found", { status: 404 });

  if (supabaseConfigured()) {
    const { data } = await (await createClient()).storage.from(bucket).createSignedUrl(rel, 15 * 60);
    return data?.signedUrl ? Response.redirect(data.signedUrl, 302) : new Response("Not found", { status: 404 });
  }
  const file = path.join(localRoot(), bucket, rel);
  const info = await stat(file).catch(() => null);
  if (!info?.isFile()) return new Response("Not found", { status: 404 });
  const ext = path.extname(file).slice(1).toLowerCase();
  return new Response(Readable.toWeb(createReadStream(file)) as ReadableStream, { headers: { "Content-Type": TYPES[ext] ?? "application/octet-stream", "Content-Length": String(info.size), "Cache-Control": "private, max-age=900", "X-Content-Type-Options": "nosniff" } });
}
