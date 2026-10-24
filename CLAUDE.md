# Eunike Superapp
- Follow docs/PRD_Eunike_Superapp_for_Claude_Code.md. Requirement IDs go in commit messages.
- Do not change the visual design. Reuse tokens in docs section 5. Port, don't reinterpret.
- Enforce permissions in the server and in Postgres RLS. Never rely on UI hiding.
- Never use SUPABASE_SERVICE_ROLE_KEY in client code. Never log personal data.
- Counseling content is readable only by the assigned konselor.
- UI text is Indonesian from messages/id.json; no hard-coded strings.
- Commands: pnpm dev | pnpm test | pnpm e2e | pnpm db:test | pnpm lint | pnpm typecheck
- When blocked by an OPEN question, choose the simplest reversible option and add // OPEN Q-xx.
