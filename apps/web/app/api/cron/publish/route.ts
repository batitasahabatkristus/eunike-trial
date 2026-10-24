import { timingSafeEqual } from "node:crypto";
import { asService, dbConfigured } from "@/lib/db";

/**
 * KU-03: publishes every lesson whose publish_at has passed. Vercel Cron calls it every few minutes with
 * `Authorization: Bearer $CRON_SECRET`. Safe to run twice: a published lesson is never touched again.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") ?? "";
  const want = `Bearer ${secret ?? ""}`;
  if (!secret || got.length !== want.length || !timingSafeEqual(Buffer.from(got), Buffer.from(want))) return new Response("Unauthorized", { status: 401 });
  if (!dbConfigured()) return new Response("Database not configured", { status: 503 });
  const n = await asService(async (q) => (await q.one<{ n: number }>("select public.publish_due_lessons() as n"))?.n ?? 0);
  return Response.json({ published: n });
}
