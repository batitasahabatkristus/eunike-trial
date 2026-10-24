# Eunike Superapp

Public website + one-login family platform for Yayasan Eunike. Spec: `docs/PRD_Eunike_Superapp_for_Claude_Code.md`.
Status and open items: `docs/STATUS.md`.

## Run locally (no Supabase needed)

```bash
pnpm install
cp apps/web/.env.example apps/web/.env.local   # keep EUNIKE_DEV_AUTH=1
pnpm dev                                       # http://localhost:3000
```

`/masuk` shows a **fake-persona login** (one button per role, fake data only). It is refused when
`VERCEL_ENV=production` and when `NODE_ENV=production` outside Vercel previews.

## Run against Supabase

1. Create a staging project (Singapore). Apply `supabase/migrations/*.sql`, then `supabase/seed.sql` (fake data).
2. Fill `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SITE_URL`.
3. Auth settings: enable Google; add `SITE_URL/auth/callback` as a redirect URL; set session time-box
   (parents 30 days, staff 12 h; PRD A-05); require MFA for the roles in `MFA_ROLES` (`lib/roles.ts`).

## Checks

`pnpm typecheck && pnpm lint && pnpm test && pnpm db:test && pnpm e2e`

`pnpm e2e` also starts a static server for `reference/website-prototype` (needs `python3`) and diffs the homepage against it (WEB-01).
(`PW_CHROMIUM_PATH=/path/to/chromium pnpm e2e` if the machine's browser build differs.)
