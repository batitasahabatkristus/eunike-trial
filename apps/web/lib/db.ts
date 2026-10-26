import "server-only";
import { Pool, type PoolClient, type QueryResultRow } from "pg";

/**
 * Data access with Row-Level Security as the real gate (PRD §0.1, AC-02).
 * Every user query runs in a transaction as `authenticated` with the verified user id in the JWT-claim settings,
 * exactly how PostgREST does it. The id comes from the server-verified session, never from the client.
 */
let pool: Pool | undefined;
const getPool = () => (pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: Number(process.env.DATABASE_POOL_MAX ?? 10) }));
export const dbConfigured = () => Boolean(process.env.DATABASE_URL);

export interface Q {
  <T extends QueryResultRow = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T extends QueryResultRow = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
}

/** One connection runs one query at a time: queue calls (pages use Promise.all) instead of tripping pg's "already executing" warning. */
function makeQ(c: PoolClient): Q {
  let tail: Promise<unknown> = Promise.resolve();
  const exec = (sql: string, params?: unknown[]) => {
    const next = tail.then(() => c.query(sql, params));
    tail = next.catch(() => undefined);
    return next;
  };
  const q = (async (sql: string, params?: unknown[]) => (await exec(sql, params)).rows) as Q;
  q.one = async (sql, params) => (await exec(sql, params)).rows[0] ?? null;
  return q;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function run<T>(role: "authenticated" | "service_role", userId: string | null, fn: (q: Q) => Promise<T>): Promise<T> {
  if (userId && !UUID.test(userId)) throw new Error("invalid user id");
  const c = await getPool().connect();
  try {
    // begin + role + identity in ONE round trip (the database can be an ocean away). userId is a validated uuid, so inlining it is safe.
    // Both claim spellings: the stub reads claim.sub, current Supabase reads the claims JSON.
    const claims = userId ? `, set_config('request.jwt.claim.sub', '${userId}', true), set_config('request.jwt.claims', '{"sub":"${userId}","role":"authenticated"}', true)` : "";
    await c.query(`begin; select set_config('role', '${role}', true)${claims}`);
    const out = await fn(makeQ(c));
    await c.query("commit");
    return out;
  } catch (e) {
    await c.query("rollback").catch(() => undefined);
    throw e;
  } finally {
    c.release();
  }
}

/** Run as a signed-in person. RLS applies. */
export const asUser = <T>(userId: string, fn: (q: Q) => Promise<T>) => run("authenticated", userId, fn);
/** Server jobs only (cron, import). Never reachable from a request handler that takes user input for its identity. */
export const asService = <T>(fn: (q: Q) => Promise<T>) => run("service_role", null, fn);

/** Postgres errors we turn into user-facing messages. */
export const pgCode = (e: unknown): string | undefined => (typeof e === "object" && e && "code" in e ? String((e as { code: unknown }).code) : undefined);
export const pgMessage = (e: unknown): string => (e instanceof Error ? e.message : String(e));
