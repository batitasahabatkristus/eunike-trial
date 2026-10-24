# Build status (24 Oct 2026)

Phase 0 of PRD §14 is built and verified. Phases 1 to 5 are not started.

## Verified
| Check | Result |
|---|---|
| `pnpm typecheck`, `pnpm lint`, production build | clean |
| `pnpm test` (access table, open-redirect guard, contrast, token drift against the prototype CSS, EN/ID key parity) | 39 pass |
| `pnpm db:test` (RLS on a real Postgres 16, as `anon` / `authenticated` / `service_role`) | 43 pass |
| `pnpm e2e` (8-role access flow, denied pages, role switch, forged cookie, logout, website fixes, **WEB-01 at 1440 / 1024 / 390 px**) | 21 pass |

WEB-01 compares each homepage section against `reference/website-prototype` (the approved zip) with photos hidden and the PRD §6.2 changes removed from both; the budget is 0.5% of pixels. Photos are excluded because `next/image` re-encodes them, but crops and positions are checked: section sizes must match exactly.

## Done in Phase 0
- Next.js 16 app, TypeScript strict, `proxy.ts` access flow (PRD §4.3) plus server `guard()` on pages.
- Access table (PRD §8) and role homes (§7.3) in one file: `apps/web/lib/roles.ts`. Unknown paths under an app prefix are denied by default.
- Both themes' tokens copied exactly (§5.1, §5.2) and tested against drift. Fonts self-hosted.
- Public website ported from the approved prototype (same classes, sections, assets, behavior), ID/EN, with fixes F-01 to F-15. F-16: the zip was reconciled; the live site was never reachable (see below). Contact form with honeypot and a rate limit.
- Login (SK theme): Google, family login (WhatsApp number + child DOB, rate-limited, generic errors), email link. Role picker. Access denied. Consent gate on first login.
- Postgres: roles, families, children, consents, notifications, append-only audit log, JWT role sync, rate limiter, family-login lookup. RLS on every table.
- Every route in the access table resolves behind its guard to a "Segera hadir" page until its module ships.

## Needs Eunike before launch
1. **Claims (F-05).** Kept from the prototype as content in `messages/*.json`: "Since 1998" (hero badge), the values ribbon (Interdenominational, Evangelical, ...), and the Transparent / Accountable / Collaborative cards. Confirm each. The NGO structured data omits the founding year until confirmed.
2. **Indonesian copy** is my translation of the prototype text. A native reviewer should read it, especially the script-font hero line, which is longer in Indonesian.
3. **F-01 rewrites.** The Journey and Stories intros were design-brief text in the prototype. I rewrote them (EN and ID). Approve the wording.
4. **Eureka and HS4Life links (Q-15).** No URLs known, so both link to the contact section. Sahabat Kristus, Counseling and Training link into the platform (`/sk/daftar`, `/konseling/konseli`, `/event/peserta`).
5. **Privacy and terms (F-11)** are drafts built from the PRD, shown with a draft banner until legal review (Q-09).
6. **Giving details (F-13).** Nothing shown. Set `NEXT_PUBLIC_GIVING_ACCOUNT` once decided (Q-07).
7. **The live site was not reachable** from this environment, so anything newer than the zip (`portal.html`, `admin.html`) was not reconciled (F-16). If the live site has changed copy or sections since the zip, send them.

## Not verified (needs a real Supabase project)
Google sign-in, email link, family login against Supabase Auth (`generateLink` + `verifyOtp`), consent insert through the user client, MFA enforcement, session lifetimes. The SQL they depend on is tested; the Supabase Auth calls are not.

## Not built yet
Website CMS (copy lives in `messages/*.json` as the fallback), 2FA enrolment screens, error tracking, Lighthouse and axe in CI, the import script, and everything in Phases 1 to 5.

## Decisions I made that you may want to reverse
- The closed mobile menu is now `visibility:hidden`. The prototype only faded it, which left invisible links reachable by keyboard.
- Small pink text uses `#BC0F74` (`--pink-text`) instead of `--pink`: the original is 3.98:1 on cream and 3.6:1 on pale pink. Large text and buttons keep `--pink`.
- The inactive language label is 72% opacity instead of 45% (contrast).
- Demo-only art (Zakheus lesson images) is not on the public site. The Sahabat Kristus logo from the demo appears only on the login page.

## Open questions that changed behaviour
Q-02 repo source; Q-03 themes as in A-03; Q-04 DOB+phone login kept with rate limits (no PIN yet); Q-05 konseli form public; Q-06 volunteer/pendamping exist in the enum only; Q-08 default locale `id`; Q-15 link out.

## Next
Phase 1 (SK parity): `sk_*` tables and RLS, parent lesson flow, guru attendance, curriculum editor, admin dashboard. The demo in `reference/demo/Eunike_Demo_Klik.html` is the behaviour reference.
