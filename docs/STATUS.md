# Build status (24 Oct 2026)

Phases 0 and 1 of PRD §14 are built and verified locally. Phases 2 to 5 are not started.

**Phase 1 (SK parity)** covers CO-01..10, SK-01..13, GU-01..05, KU-01..04, AD-01..06 and the pilot import script. See `docs/SK_PARITY.md`. Tables below are Phase 0 figures; current counts are in the next section.

## Phase 1 verification
| Check | Result |
|---|---|
| typecheck, lint (0 errors), unit | clean, 49 pass |
| `pnpm db:test` (RLS on real Postgres, all SK tables and functions) | 161 pass |
| `pnpm e2e` (Phase 0 + SK flows + WEB-01) | 28 pass |
| Pilot import rehearsal on fake CSV, run twice | 1st run creates rows and reports 4 problems; 2nd run creates 0 |

**Not verified:** anything that needs a real Supabase project (Auth flows, signed upload/download URLs, MFA). Pilot CSV columns are my assumption (Q-14): send the real exports.

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
Website CMS (copy lives in `messages/*.json` as the fallback), 2FA enrolment screens, error tracking, Lighthouse and axe in CI, forum-reply import, and everything in Phases 2 to 5.

## Decisions I made that you may want to reverse
- The closed mobile menu is now `visibility:hidden`. The prototype only faded it, which left invisible links reachable by keyboard.
- Small pink text uses `#BC0F74` (`--pink-text`) instead of `--pink`: the original is 3.98:1 on cream and 3.6:1 on pale pink. Large text and buttons keep `--pink`.
- The inactive language label is 72% opacity instead of 45% (contrast).
- Demo-only art (Zakheus lesson images) is not on the public site. The Sahabat Kristus logo from the demo appears only on the login page.

## Open questions that changed behaviour
Q-02 repo source; Q-03 themes as in A-03; Q-04 DOB+phone login kept with rate limits (no PIN yet); Q-05 konseli form public; Q-06 volunteer/pendamping exist in the enum only; Q-08 default locale `id`; Q-15 link out.

## Before any real data or real users (do not skip)
- Reset the Eunike trial database password (Supabase: Connect, Reset database password) to a random 24+ character letters-and-numbers one, then update `DATABASE_URL` in Vercel. The current one was shown in a screenshot and is weak.
- Turn on leaked-password protection in Supabase Authentication.
- Add a PIN attempt limit: `verify_family_pin` can be called directly by a signed-in family member and is not rate limited.
- Replace fake-persona login with real sign-in (Google / WhatsApp + date of birth) and test it; the persona login only works on Vercel Preview.
- Decide who may see real children's data and how parents consent (Q-09).

## Next
Phase 2 (KTB). Before that: a Supabase staging project to verify Auth and storage, and the real pilot exports.
