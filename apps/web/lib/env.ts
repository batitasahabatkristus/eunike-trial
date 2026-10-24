import "server-only";

export const supabaseConfigured = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/**
 * Fake-persona login for local work and preview deployments with seed data only.
 * Hard-off in production so it can never be a back door (PRD §0.1: no real data outside prod).
 */
export const devAuthEnabled = () => {
  if (process.env.EUNIKE_DEV_AUTH !== "1") return false;
  if (process.env.VERCEL_ENV === "production") return false;
  // Self-hosted production builds stay off; Vercel previews (fake seed data) may opt in.
  return process.env.NODE_ENV !== "production" || process.env.VERCEL_ENV === "preview";
};

export const siteUrl = () => process.env.SITE_URL ?? "http://localhost:3000";
