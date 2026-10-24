import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { supabaseConfigured } from "@/lib/env";

const memory = new Map<string, { n: number; reset: number }>();

/** True when the call is allowed. Postgres-backed in deployed environments so limits hold across serverless instances. */
export async function rateLimit(key: string, max: number, windowSeconds: number): Promise<boolean> {
  if (supabaseConfigured() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data, error } = await createAdminClient().rpc("rate_limit_hit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (!error) return data === true;
    // Fail closed for a limiter that guards login; fail open is never acceptable there.
    return false;
  }
  const now = Date.now();
  const cur = memory.get(key);
  if (!cur || cur.reset < now) {
    memory.set(key, { n: 1, reset: now + windowSeconds * 1000 });
    return true;
  }
  cur.n += 1;
  return cur.n <= max;
}

export async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}
