# Eunike Superapp: Product Requirements for Claude Code

Version 1.0 · 24 Oct 2026 · Owner: Yayasan Eunike digital team (Michelle, Darren)
Audience: Claude Code (implementation), reviewed by the Eunike board on 30 Oct 2026.
Language of this document: English. Language of the product UI: Indonesian (Bahasa Indonesia), with an English toggle on the public website.

---

## 0. How to use this document

1. Read sections 1 to 5 fully before writing code.
2. Build in the phase order in section 14. Do not skip ahead.
3. Every requirement has an ID (for example `SK-12`). Reference IDs in commits and PR titles.
4. `ASSUMPTION` marks something decided by us without confirmation. `OPEN` marks a question that needs a human answer. Section 15 lists all of them. When blocked on an `OPEN`, build the simplest reversible option, leave a `// OPEN Q-xx` comment, and continue.
5. The clickable demo (`Eunike_Demo_Klik.html`, source in `Eunike_Demo_Proyek.zip`) is the behavioral reference for every screen: layout, labels, states, and flows. Put it in the repo at `/reference/demo/`. If this document and the demo disagree, this document wins; tell us about the conflict.
6. The website redesign prototype (`eunike-redesign-prototype`) is the visual reference for the public website and the design language of the whole product.

### 0.1 Non-negotiable rules

- **Do not change the design.** The website redesign and the demo screens are approved. Port them faithfully. Allowed changes are only the fixes listed in section 6.2 and anything explicitly requested here.
- **Never trust the client.** Every permission is enforced on the server and in the database (row-level security). Hiding a button or redirecting a page is never the only protection.
- **Never use the Supabase service-role key in browser code.** Server-only, and only where listed.
- **No real personal data in staging, previews, tests, logs, or screenshots.** Use fake seed data. Children's data is the most sensitive data in this system.
- **Counseling notes are readable only by the assigned konselor.** No admin, director, or super admin role may read them through the app.
- **Indonesian first** for UI copy. All strings live in translation files, never hard-coded in components.

---

## 1. Product summary

Yayasan Eunike is a Christian non-profit in Jakarta that helps families grow closer to God through lessons, groups, events, counseling, and community. Today Eunike runs on Google Sheets and Apps Script (the SK Batita pilot), WhatsApp, and printed materials.

**The superapp** is one web platform with one login and many modules on one shared core of people, families, roles, consent, and history:

| Module | Purpose |
|---|---|
| Public website | Introduce Eunike, programs, contact, partnership (the redesign prototype) |
| Core and Home | Identity, roles, families, notifications, search, settings, launcher |
| SK (Sahabat Kristus) | Kids lessons for parents, class attendance, curriculum, reports, admissions |
| Admissions | Registration of prospective SK parents, references, journal review, interview, decision |
| Finance (basic) | Invoices and payment verification |
| Konseling | Private counseling requests, assignment, session notes |
| Communication | Announcements to audiences, content calendar |
| KTB | Small groups: facilitators, attendance, department recap |
| Events | Registration, QR tickets, check-in |
| Staff and HR | Attendance, leave, evaluation |
| Management | Aggregate dashboard for directors |
| Website CMS | Edit public website text, photos, links without code |

### 1.1 Goals

- G1. Replace the Google Sheets pilot for SK Batita with a faster, safer system without losing any pilot feature.
- G2. One account per person, any number of roles, one login.
- G3. Every workflow in section 11 works end to end across roles.
- G4. The public website and the app feel like one product.
- G5. A volunteer-run team can maintain it: one repo, one deployment, boring technology.

### 1.2 Non-goals for this version

Native mobile apps, a payment gateway, AI features, video hosting (lesson videos stay on Google Drive at first), advanced HR, accounting, multi-language app UI beyond Indonesian (the website is bilingual EN/ID).

---

## 2. Inputs and source of truth

| Input | Status | Use |
|---|---|---|
| Live site `https://eunike-family-web.vercel.app` | Newer than the zip. Has `portal.html` (family platform prototype) and `admin.html` (website CMS prototype using localStorage, bilingual EN/ID fields) | **Source of truth for the website.** Claude Code must read the deployed repo, not the zip |
| `eunike-redesign-prototype.zip` | Older snapshot. Homepage only (English), no portal section, no CMS | Visual reference; compare against the live repo and reconcile (fix F-16) |
| `Eunike_Demo_Klik.html` and project zip | Approved clickable demo, 70 screens, fake data | Behavior and layout reference for the app |
| SK Batita pilot (Apps Script + Google Sheets + Vercel static frontend) | Running; EPK for Jul to Dec 2026 lives here | Migration source (section 13) |
| ChatGPT design mockups (`Eunike_webapp.pdf`) | Approved look for app screens | Visual reference |
| Earlier PRD v4 and SK Batita design handoff | Approved decisions on roles, tables, SK design | Wherever this document is silent, follow them |

`OPEN Q-02`: the zip and the live site differ. Confirm the repo to work in.

---

## 3. Decisions already made

| # | Decision |
|---|---|
| D1 | Backend: Supabase (Postgres, Auth, Storage), region Singapore. Hosting: Vercel. Google Sheets only as an export target |
| D2 | One app, many modules. Modules are path prefixes now (`/sk/...`); they can become subdomains later without UI changes |
| D3 | One login. A person has one account and many roles. Role decides the first page after login |
| D4 | Lesson videos stay on Google Drive at first (embed or link), moved later |
| D5 | The SK pilot keeps running until a semester boundary; migrate Batita then, not mid-semester |
| D6 | Parent login keeps parity with the pilot: Google, or WhatsApp number + child's date of birth |
| D7 | Two themes in one design system: Eunike theme and SK theme (section 5) |
| D8 | The director sees aggregate numbers only. Counseling content is never visible to admins |
| D9 | Two owners on the organization email for Supabase, Vercel, and GitHub, with 2FA |

---

## 4. Architecture

### 4.1 Stack

- Next.js (App Router) + TypeScript (strict), React Server Components by default.
- Supabase: Postgres, Auth, Storage. Use `@supabase/ssr` for cookie sessions.
- Styling: plain CSS variables + CSS Modules or a small utility layer. **Port the existing CSS tokens exactly.** Do not introduce a UI kit that changes the look (no default Tailwind palette, no component library themes).
- Forms: React Hook Form + Zod, with the same Zod schemas validated again on the server.
- Tests: Vitest (unit), Playwright (e2e and visual), SQL tests for row-level security.
- Lint and format: ESLint, Prettier. CI on every PR: typecheck, lint, unit, e2e smoke, RLS tests.
- Environments: `local`, `preview` (every PR, uses a separate staging Supabase project with fake data), `production`.

### 4.2 Repository layout

```
/apps/web                    Next.js app (the only deployable)
  /app
    /(public)                website: /, /tentang, /program, /kontak, /privasi, /syarat
    /masuk                   login
    /beranda                 Eunike Home
    /sk/{keluarga,guru,kurikulum,admin,daftar,referensi/[token]}
    /ktb/{kelompok,pembicara,admin}
    /event/{peserta,panitia,admin}
    /staf/{saya,head,hrd}
    /markom/{admin,website}
    /konseling/{konseli,konselor,admin}
    /keuangan/{tagihan,laporan}
    /pengurus
    /akses-ditolak
  /components                design-system components (section 5.4)
  /lib                       supabase clients, auth, roles, i18n, audit, utils
  /messages/{id.json,en.json}
/supabase
  /migrations                SQL, one file per change, never edited after merge
  /seed.sql                  fake data
  /tests                     RLS tests
/reference/demo              the clickable demo (read-only reference)
/docs                        this PRD, ADRs, runbooks
```

### 4.3 Access flow (applies to every request)

1. Request interception (middleware or proxy, per the installed Next.js version) reads the session.
2. No session on a protected path: redirect to `/masuk?next=<path>`.
3. Session but role not allowed for the path (table in section 8): render `/akses-ditolak` with a button to the person's own home. Never reveal that the protected page exists beyond that.
4. Allowed: render. Server components fetch data with the user's session. Row-level security is the final gate.
5. After login, redirect to `next` if allowed; otherwise to the role home (section 7.3).

Rules:
- Interception is a convenience. **Row-level security and server checks are the real protection** (REQ `AC-01`).
- Generic login error messages: "Nomor atau tanggal lahir belum cocok." or "Email atau kode salah". Never reveal whether an account exists.
- Domain plan: now all paths live under `eunike-family-web.vercel.app`. Later, `sk.eunikefamily.org/guru` maps to `/sk/guru`. Keep route helpers in one file (`lib/routes.ts`) so the move is a config change. `OPEN Q-13`.

---

## 5. Design system

**The design is approved. Reproduce it; do not reinterpret it.**

### 5.1 Tokens: Eunike theme (public website, Home, staff, admin, platform shell)

Copied from the website prototype `styles.css`. Do not rename or round them.

```
--purple:#612E8F  --purple-2:#8F4698  --purple-deep:#452063
--lilac:#D9C7E1   --pink:#DD188A      --pink-bright:#F23DA2
--pink-soft:#FAD9E8  --peach:#FCD3C9  --cream:#FEECE2  --paper:#FFF9F6
--ink:#392340  --muted:#6F5B73  --white:#FFFFFF  --yellow:#F5C64B
--line:rgba(97,46,143,.14)
--shadow-sm:0 12px 30px rgba(67,31,84,.08)  --shadow-md:0 24px 65px rgba(67,31,84,.14)
--radius-xl:42px --radius-lg:30px --radius-md:22px  --container:1180px
```
Fonts: Baloo 2 (headings), Quicksand (body), Parisienne (small accents only). Load with `next/font` (self-hosted), same weights as the prototype. Primary button: pink `#DD188A`, pill, 50px high, hover lifts 2px. Secondary: translucent white with purple outline.

### 5.2 Tokens: SK theme (Sahabat Kristus parent lesson screens only)

From the SK Batita design handoff. Used on: SK parent home, Alur, Cerita, Ayat, Sharing, PoWeR, Memory Marker, class Memory Marker and Forum for guru, and the login page.

```
red #DD1F4A   red-dark #B8123A   purple #5B2590   purple-accent #8446C9
bg #FFF2F6    card #FFFFFF       lilac #F1E7FC    pink-light #FDE5EE
peach #FFF0D4 mint #E2F5E9       text #2A1740     muted #6B5A7E
border #F1DEEA progress-off #E8D5F0 success #1B8A4B  fullscreen-overlay #150D1D
```
Fonts: Nunito (body), Baloo 2 700 to 800 (headings), Fredoka 500 to 700 (buttons and step titles). Rule: purple means choosing and navigating; red means action and finishing.

`ASSUMPTION A-03`: the demo used Nunito and red actions on every app screen. The website uses Quicksand and a pink primary. Final rule: **Eunike-theme screens follow the website tokens; SK-theme screens follow the SK tokens.** Admin and staff screens that the demo drew in red adopt the pink primary. Confirm in `OPEN Q-03`.

### 5.3 Layout and behavior rules (from the demo)

- Mobile: 390 px design width, floating rounded bottom tab bar, back-button header. Desktop: left sidebar (logo, icon + label, user card with role at the bottom) and top bar (search, role switcher, bell).
- Breakpoints: follow the prototype (1080, 840, 620 px). Admin screens are desktop first and degrade to stacked cards under 840 px.
- Every list has three states: empty, loading skeleton, error with "Coba lagi".
- Touch targets at least 44 px. Visible focus ring on every interactive element (the prototype has none beyond the skip link; fix F-07).
- Decorative blobs and wave lines are CSS only, `aria-hidden`.
- Toasts confirm saves. Destructive actions use a modal.
- Respect `prefers-reduced-motion` (already in the prototype).

### 5.4 Components to build once, reuse everywhere

Button (primary, secondary, text, disabled), Chip, Badge (status colors in 5.5), Card, SegmentedTabs, Tabs (underline), Input, Select, Textarea, Toggle, Checkbox, RadioCard, Avatar, ProgressBar, StepStrip (24 segments), Timeline, Calendar (month and week strip), DataTable (sticky header, sort, pagination), Drawer, Modal, BottomSheet, Toast, EmptyState, Skeleton, ErrorState, QRCode, FileUpload, RichText (narration editor), BarChart (simple, CSS or SVG), RoleSwitcher, Header and Nav shells (public, mobile app, desktop app).

### 5.5 Status badge colors

Pending orange · Perlu Jawaban pink · Interview purple · Selesai green · Active blue · Rejected red · Batal grey · Draf grey-purple · Terjadwal orange · Terbit green · Lunas green · Menunggu orange.

---

## 6. Website: port and fixes

### 6.1 Port

- Port `index.html`, `styles.css`, `script.js` into Next.js components. Keep class names, tokens, spacing, and section order. Keep the reveal-on-scroll behavior and sticky header scroll state.
- Acceptance `WEB-01`: Playwright visual comparison of the homepage at 1440, 1024, and 390 px against the live prototype. Differences above 0.5 percent of pixels fail the build, except where a fix in 6.2 applies.
- Assets move to `/public/assets` (same filenames) and render through `next/image` with the same crops (fix F-10).

### 6.2 Fixes needed (the only allowed changes)

| ID | Problem found in the prototype | Fix |
|---|---|---|
| F-01 | Internal design-brief text appears as public copy: the Stories paragraph ("The visual direction intentionally uses real Eunike moments, less corporate stock photography...") and the Journey intro ("...the website should help each visitor quickly find the support..."). Also README says program links are placeholders | Rewrite as visitor-facing copy in EN and ID, approved by Eunike. Do not ship the current wording |
| F-02 | "EN / ID" pill is a non-functional button (`cursor:default`, title "Language switcher concept"). Page is English only | Working EN/ID switch using `/en` and `/id` locale routes, `lang` attribute per locale, `hreflang`. Default locale `id` for Indonesian browsers (`OPEN Q-08`). All copy comes from the CMS (section 10.15) with fallback files |
| F-03 | Program cards and most CTAs link to `#contact` | Link to real destinations: Sahabat Kristus to `/sk` info + `/sk/daftar`; Family Counseling to `/konseling/konseli`; Training and events to `/event`; Eureka and HS4Life to their own sites or a program page (`OPEN Q-15`) |
| F-04 | No way into the platform | Add a **Masuk** button to the header (secondary style next to "Connect with us") and a "Portal" mention in the hero or ecosystem section, as in the live version. No new visual style |
| F-05 | Hard-coded claims ("Since 1998", "Transparent, Accountable" principles) | Mark as content fields in the CMS. Eunike confirms each claim before launch (`OPEN Q-08`) |
| F-06 | No SEO or sharing metadata | Per-page title and description (EN, ID), Open Graph and Twitter cards, favicon set, `sitemap.xml`, `robots.txt`, Organization (NGO) JSON-LD |
| F-07 | No visible focus styles; text contrast not verified | Add `:focus-visible` ring using `--purple`. Verify contrast 4.5:1 or better for text, especially pink text on cream or lilac. Adjust only the failing text color by the smallest step |
| F-08 | Anchored sections hide under the fixed header (no `scroll-margin-top`) | Add `scroll-margin-top` equal to header height to anchor targets |
| F-09 | Mobile menu has no focus trap or Escape handling | Escape closes; focus returns to the toggle |
| F-10 | Images are plain `<img>` (most 100 to 220 KB, up to 1400 px wide), no explicit dimensions | `next/image`, AVIF/WebP, `sizes`, intrinsic width and height to prevent layout shift. Keep crops |
| F-11 | No privacy policy, terms, or cookie note, yet the platform will hold family data | Add `/privasi` and `/syarat` (content from Eunike and legal review), footer links, consent record on first login (section 9) |
| F-12 | Contact is only mailto and tel links | Add a simple contact form (name, email or WhatsApp, message) storing to `contact_messages`, with spam protection (honeypot + rate limit). Keep the mailto links |
| F-13 | Partner section has no giving or partnership flow | Show Eunike's bank details or a "Hubungi kami" action; no payment gateway in v1 (`OPEN Q-07`) |
| F-14 | Fonts load from Google at runtime | Self-host through `next/font` (same families and weights) |
| F-15 | At 840 px and below the language pill and the "Connect with us" button are both `display:none`, so phone visitors have no language switch, no CTA, and no way to log in | Keep the desktop design. Add the language switch, "Connect with us", and **Masuk** as items inside the existing mobile menu panel, same styling as the other menu links |
| F-16 | Zip and live site differ (portal and admin pages missing in the zip) | Reconcile against the live repo; portal.html is replaced by the real app; admin.html becomes `/markom/website` (section 10.15) |

---

## 7. Identity, roles, and access

### 7.1 Login methods (one account, several ways in)

- Google sign-in (staff, admin, many parents).
- Parent family login: WhatsApp number + child's date of birth (pilot parity, D6). Server action: rate limit by IP and by number (for example 5 failures, 15-minute lock), constant-time generic error, audit every attempt. On success, sign in the linked Supabase user server-side (admin API, never from the browser). Scope of this session: the family's own data only. `OPEN Q-04`: DOB plus phone is a weak secret. Option to add a 4-digit family PIN (the pilot already has a family PIN for EPK).
- Email magic link for people without Google (HRD, external reviewers). `ASSUMPTION A-04`.
- 2FA (TOTP) mandatory for: Super admin, Admin SK, Admin Konseling, HRD, Bendahara, Pengurus.
- Reference givers (Pemberi referensi) have **no account**: one-time token link (single use, expires in 14 days).

### 7.2 Roles

`super_admin`, `pengurus`, `parent` (Orang tua), `prospect_parent` (Calon orang tua SK), `reference_giver` (token only), `journal_reader`, `interviewer`, `sk_guru`, `sk_kurikulum`, `sk_admin`, `sk_registration_admin`, `bendahara`, `ktb_member`, `ktb_facilitator`, `ktb_speaker`, `ktb_admin`, `ktb_head`, `event_participant`, `event_committee`, `event_admin`, `staff`, `hrd`, `head_department`, `konseli`, `konselor`, `konseling_admin`, `markom`.
`OPEN Q-06`: Volunteer and Pendamping roles are not decided. Create the enum values `volunteer` and `pendamping` disabled in the UI.

Roles are rows in `user_roles` with scope (global, class, group, event, department) and an active flag. Role changes are audited and show the "Perubahan peran dicatat di audit" note.

### 7.3 Role home pages

| Role | Home after login |
|---|---|
| parent | `/sk/keluarga` if the family belongs only to SK; otherwise `/beranda` |
| sk_guru | `/sk/guru` |
| sk_kurikulum | `/sk/kurikulum` |
| sk_admin | `/sk/admin` |
| sk_registration_admin | `/sk/admin/pendaftar` |
| prospect_parent | `/sk/daftar/status` |
| journal_reader, interviewer | `/sk/admin/jurnal`, `/sk/admin/wawancara` |
| bendahara | `/keuangan/tagihan` |
| ktb_member, ktb_facilitator, ktb_speaker | `/ktb/kelompok` |
| ktb_admin, ktb_head | `/ktb/admin` |
| event_participant, event_committee, event_admin | `/event/peserta`, `/event/panitia`, `/event/admin` |
| staff | `/staf/saya` |
| head_department | `/staf/head` |
| hrd | `/staf/hrd` |
| konseli | `/konseling/konseli` |
| konselor | `/konseling/konselor` |
| konseling_admin | `/konseling/admin` |
| markom | `/markom/admin` |
| pengurus | `/pengurus` |
| super_admin | `/pengurus` with an "Admin" switcher |

Several roles: show the **Masuk sebagai** sheet (modal on desktop, bottom sheet on mobile); remember the last choice per device.

### 7.4 Requirements

- `AC-01` Every protected route checks session and role on the server. A role outside the allowed list gets `/akses-ditolak`, HTTP 403 for API routes.
- `AC-02` Row-level security is enabled on every table. A test per table proves a user without the right role reads zero rows.
- `AC-03` A person with several roles can switch roles without logging out; the active role is shown in the top bar.
- `AC-04` Login lockout after repeated failures; events are in `audit_log`.
- `AC-05` Session lifetime: 30 days for parents on a trusted device, 12 hours for staff and admin roles. `ASSUMPTION A-05`.

---

## 8. Route map and access table

Paths are relative to `https://eunike-family-web.vercel.app`. "Public" means no login.

| Path | Allowed roles | Demo screen(s) |
|---|---|---|
| `/`, `/id`, `/en`, `/privasi`, `/syarat` | Public | Website |
| `/masuk` | Public | Login (SK theme), Pilih peran, Akses ditolak |
| `/beranda` | any logged-in | Eunike Home |
| `/beranda/jadwal`, `/keluarga`, `/keluarga/kartu`, `/keluarga/anak-grup`, `/notifikasi`, `/cari`, `/pengaturan`, `/parenting`, `/laporan` | parent (and staff for jadwal, notifikasi, cari, pengaturan) | Jadwal, Keluarga Saya, Kartu, Daftar anak, Notifikasi, Pencarian, Pengaturan, Parenting, EPK |
| `/sk/keluarga` (+ `/data`, `/alur`, `/cerita`, `/ayat`, `/sharing`, `/power`, `/memory-marker`, `/selesai`) | parent | SK Beranda to Memory Marker |
| `/sk/guru` (+ `/absensi`, `/kelas`, `/memory-marker`, `/forum`, `/refleksi`) | sk_guru | Guru screens |
| `/sk/kurikulum` (+ `/materi/[id]`, `/jadwal`, `/pustaka`) | sk_kurikulum | Kurikulum screens |
| `/sk/admin` (+ `/keluarga`, `/grup`, `/hadir`, `/epk`, `/akun`) | sk_admin, super_admin | Admin SK screens |
| `/sk/admin/pendaftar` (+ `/[id]`, `/pasangan`, `/wawancara`) | sk_registration_admin, sk_admin | Admin Pendaftaran |
| `/sk/admin/jurnal` | journal_reader | Pembaca jurnal |
| `/sk/admin/wawancara/saya` | interviewer | Pewawancara |
| `/sk/daftar` (+ `/individu`, `/jurnal`, `/terkirim`) | Public (draft by token or email) | Pendaftaran 1 to 3, sukses |
| `/sk/daftar/status` | prospect_parent | Status pendaftaran |
| `/sk/referensi/[token]` | Token only | Formulir referensi |
| `/keuangan/tagihan`, `/keuangan/laporan` | bendahara, super_admin | Bendahara |
| `/ktb/kelompok` | ktb_member, ktb_facilitator, ktb_speaker | KTB parent, fasilitator |
| `/ktb/admin` (+ `/rekap`) | ktb_admin, ktb_head | Admin KTB, Rekap |
| `/event/peserta`, `/event/panitia`, `/event/admin` | event_participant, event_committee, event_admin | Event |
| `/staf/saya` (+ `/evaluasi`) | staff | Home Staf |
| `/staf/head`, `/staf/hrd` | head_department, hrd | Persetujuan, HRD |
| `/markom/admin` (+ `/pengumuman`) | markom | Kalender konten, Pengumuman |
| `/markom/website` | markom, super_admin | Website CMS |
| `/konseling/konseli` | Public form (consent required) | Konseli form |
| `/konseling/konselor` | konselor | Konselor |
| `/konseling/admin` | konseling_admin | Admin Konseling |
| `/pengurus` | pengurus, super_admin | Eunike Hari Ini |
| `/akses-ditolak` | any | Akses ditolak |

`OPEN Q-05`: whether the Konseli form requires login.

---

## 9. Data model, privacy, and security

### 9.1 Conventions

- UUID primary keys, `created_at`, `updated_at`, `created_by`. Soft delete (`deleted_at`) for people, families, and content. Hard delete only through a documented, audited runbook.
- All timestamps `timestamptz`, displayed in `Asia/Jakarta`.
- Enums for statuses. Migrations only forward.
- Every table has row-level security **enabled**. Policies use helper functions `has_role(role, scope)` and `is_family_member(family_id)`.
- `audit_log(actor, role, action, table, row_id, before, after, ip, at)` is append-only. Written by database triggers for the sensitive tables and by the app for logins.

### 9.2 Tables (about 55; columns abbreviated, add obvious ones)

**Core:** `profiles`, `user_roles`, `families`, `family_members` (relation: papa, mama, wali, anak), `children` (dob, class), `consents` (type, version, at, by), `notifications`, `audit_log`, `search_index` (view), `contact_messages`.

**SK:** `sk_classes` (Elia, Markus, Yakub, Titus-A; semester), `sk_class_members`, `sk_meetings` (date, class, lesson), `sk_attendance` (meeting, person or family, status in/out/null; **one table only**, replacing the pilot's two), `lessons` (number, title, truth, publish_at, status draft/review/scheduled/published), `lesson_steps` (lesson, position 1..24, type, content jsonb), `lesson_scenes` (lesson, position 1..5, image, narration_1_2, narration_2_3, narration_3_4), `lesson_assets`, `lesson_progress` (family, lesson, step, done_steps), `ayat_progress`, `power_items`, `power_progress`, `sharing_posts` (class, lesson, family, text, hidden, pinned), `sharing_likes`, `forum_posts`, `memory_markers` (family, child, lesson, q1..q4, love_in_action text[], faith_talk, couch_time, files), `memory_marker_files` (max 3, 50 MB each, Storage path), `data_corrections` (family, text, status open/resolved), `epk_reports` (family, child, semester, parent_5g jsonb, teacher_5g jsonb, p4 jsonb, status draft/parent_sent/teacher_sent/ready/published, pin_hash), `semesters`.

**Admissions:** `applications` (status pending/need/interview/selesai/active/rejected/batal, decision, decided_by), `application_people` (suami, istri), `application_children`, `application_references` (token_hash, status, answers jsonb, used_at), `journals` (person, text, word_count), `journal_reviews` (reader, notes, done), `interviews` (interviewer, at, place, ratings jsonb, recommendation, notes), `application_events` (history timeline).

**Finance:** `invoices` (no, payer, category, amount, status waiting/proof/paid, application nullable), `payments` (invoice, proof file, verified_by, verified_at).

**Konseling:** `counseling_requests` (code KN-xxxx, for_whom, display_name, contact, needs text[], story **encrypted**, preferred_time, consent_id, urgent flag, status new/scheduled/active/closed), `counseling_assignments` (request, konselor, first_session_at), `counseling_notes` (request, konselor, body **encrypted**).

**Communication and content:** `announcements` (subject, body, channels, audience jsonb, status, sent_at, recipient_count), `announcement_deliveries` (counts only), `content_items` (title, format article/podcast/instagram/tiktok, due_date, owner, status draft/review/approved/published).

**KTB:** `ktb_groups`, `ktb_members`, `ktb_meetings`, `ktb_attendance`, `ktb_materials`.

**Events:** `events`, `event_sessions`, `event_registrations`, `event_tickets` (qr token), `event_checkins`, `event_waitlist`.

**Staff:** `staff_members` (department, manager), `staff_attendance`, `leave_balances`, `leave_requests` (status head/hrd/ok/no), `evaluations`, `evaluation_cycles`.

**Website CMS:** `site_content` (key, locale, value, status draft/published, version), `site_media` (key, storage path, alt_en, alt_id), `site_links` (key, url).

### 9.3 Row-level security rules (summary; each needs a test)

- **Parent** reads and writes only rows of their own family (`is_family_member`). Never other families, even in the same class. Sharing posts and forum show only the family display name and are limited to the same class.
- **sk_guru** reads attendance, Memory Marker, forum, and EPK rows for their assigned classes only.
- **sk_admin** reads all SK data. Cannot read counseling anything.
- **konselor** reads requests and notes **only where assigned**. `story` and `body` are decrypted server-side and only for that konselor.
- **konseling_admin** reads requests **without** `story` and notes (column-level, via a view). Can assign and schedule.
- **pengurus** reads views of aggregates (`v_dashboard_*`) with counts only. No base-table access.
- **bendahara** reads and updates `invoices` and `payments` only.
- **reference_giver** has no database role: a server route validates the token hash and writes one row.
- **Storage:** private buckets `memory-markers`, `lesson-assets`, `payment-proofs`, `site-media` (site-media public read). Signed URLs, 15-minute expiry for private files.
- `super_admin` is not a bypass for counseling content (policy excludes it).

### 9.4 Privacy and compliance (Indonesia UU PDP, 2022)

- Consent screen on first login and on every registration form; stored in `consents` with the policy version.
- Data minimization: collect only fields in this PRD. Children's data is limited to name, date of birth, class, photos or videos explicitly uploaded by parents.
- Rights: export a family's data and delete on request (admin tool, audited).
- No analytics that fingerprint users; if analytics are added, use cookieless and aggregate only.
- WhatsApp messaging only to numbers that opted in.
- Data residency: Singapore region. `OPEN Q-09`: Eunike to confirm legal review of cross-border storage and a breach-notification procedure.
- Backups: daily, restore tested before launch and each quarter.

---

## 10. Modules and requirements

Format: ID, requirement, acceptance. "Demo" points to the reference behavior.

### 10.1 Core and Home (CO)

- `CO-01` Eunike Home: greeting, role chip, bell with unread badge, "Hari ini" card, service tiles (Sahabat Kristus, Jadwal, Keluarga Saya, Acara Berikutnya, KTB, Notifikasi, Laporan Semester, Parenting), announcements. Tiles show only modules the person has a role for.
- `CO-02` Jadwal: week strip, filter chips Semua/SK/KTB/Event, rows by type. Tapping an SK row opens "Absensi keluarga" (Papa, Mama, Kayla toggles) and writes attendance; row badge becomes "Sudah isi absensi".
- `CO-03` Keluarga Saya: members, "Perjalanan keluarga" timeline from participation history, privacy toggle (default on). When off, the timeline is hidden from the family view and only anonymous counts remain in reports.
- `CO-04` Kartu anggota: member code, QR (signed token, not guessable), names, class badge, "Simpan ke galeri" (image export).
- `CO-05` Daftarkan anak ke grup: choose child, choose group (Terbuka/Penuh disabled), status Anggota baru or Pindahan. Writes `sk_class_members`; full classes block selection.
- `CO-06` Notifikasi: grouped by day, unread dots, mark all read, action buttons (for example "Isi sekarang") deep link to the task.
- `CO-07` Pencarian: grouped results (Pelajaran, Acara, Dokumen), recent searches, only returns what the user may see.
- `CO-08` Pengaturan: profile, security (password or PIN), consent record, language, help, logout.
- `CO-09` Parenting library: articles, podcasts, guides (content from `content_items` of type published).
- `CO-10` Role switcher and "Masuk sebagai" sheet (AC-03).

### 10.2 SK parent (SK)

- `SK-01` Beranda (SK theme): back to Eunike, module chip, family header, data status bar (dikonfirmasi green, koreksi terkirim purple, perlu dicek orange), horizontal lesson strip with thumbnails, hero card, "Tujuan belajar" with Ayat, Sharing, PoWeR chips, feedback link, privacy links.
- `SK-02` Default lesson is the latest published by `publish_at` (for example Pelajaran 11 on 17 Okt 2026). Unpublished lessons never appear for parents.
- `SK-03` Data Keluarga: confirm or send a correction (writes `data_corrections`; status flows to Admin SK).
- `SK-04` Alur: a strip of 24 steps, current step highlighted, Sebelumnya and Lanjut. Progress is saved per family per lesson. Step types: text, video (Drive link), story (5 scenes), ayat, sharing, power, memory marker.
- `SK-05` Cerita Alkitab: large image, age pills 1-2, 2-3, 3-4 (default 2-3, remembered), "Adegan n dari 5", scrollable narration. Tablet and landscape: image left, text right.
- `SK-06` Fullscreen: image fills the screen, "Perkecil" button, portrait phones see "Putar HP ke horizontal" with the story staying usable.
- `SK-07` Ayat: verse card, three checklist rows, progress, "Tandai sudah dihafal".
- `SK-08` Sharing: prompt, text area, post list visible to the same class only, "Ikut bersukacita" counter (one per family), lock note.
- `SK-09` PoWeR: three action cards with progress and save.
- `SK-10` Pelajaran selesai: celebration card; buttons review lesson, send Memory Marker, back home.
- `SK-11` Memory Marker (parent): four questions, Love in Action chips (Melayani, Memberi, Mengampuni), toggles Faith Talk and Couch Time, upload up to 3 files and 50 MB each with progress. Error: "Berkas terlalu besar. Maksimal 50 MB per berkas." Progress, forum, and Memory Marker are isolated per lesson.
- `SK-12` EPK (laporan semester): parent fills 5G (Growth, Gladness, Gratitude, God, Guidance), protected by family PIN to view. Published report shows parent 5G and teacher 4P (Pengamatan, Peneguhan, Percakapan, Pendampingan). PDF export.
- `SK-13` Parity gate: before any new SK feature, the new app must reproduce every pilot feature (Google login, family verification, lessons L1 to L12, forum, Memory Marker, attendance, EPK with 5G, 4P, PIN, publish and revise).

### 10.3 Guru SK (GU)

- `GU-01` Home: greeting, "Absensi Kelas Elia" card, tiles (Kelas Saya, Absensi, Memory Marker with new count, Pelajaran Minggu Ini, Forum, Refleksi 5G dan 4P), task checklist.
- `GU-02` Absensi: tabs Anggota, Pendamping, Pengurus; search; Masuk/Tidak per row; counters; one save writes all rows atomically. Re-opening shows saved state.
- `GU-03` Memory Marker kelas: lesson pills, cards with video thumbnail, "Baru" badge, "WhatsApp Mama" opens `https://wa.me/<number>` with a prefilled message.
- `GU-04` Forum: lesson pills, pin and hide (hidden posts disappear from parents; the guru sees "disembunyikan" with Restore), reply bar.
- `GU-05` Refleksi guru: sees the parent 5G once sent; writes teacher reflection and 4P; "Kirim ke admin".

### 10.4 Kurikulum (KU)

- `KU-01` Materi table with filters Semua, Draf, Terjadwal, Terbit, Ditinjau and counts; "Buat materi baru".
- `KU-02` Editor: title, number, truth, publish date, thumbnail, 5 story scenes, narration tabs per age with rich text, live phone preview, admin note banner, "Simpan draf", "Kirim ke admin untuk ditinjau". Autosave drafts.
- `KU-03` Jadwal terbit: month calendar with colored lessons, detail panel, Jadwalkan and Batalkan jadwal. Publishing happens by a scheduled job at `publish_at`.
- `KU-04` Pustaka: reusable images, songs, and videos.

### 10.5 Admin SK (AD)

- `AD-01` Dasbor: KPIs (Keluarga aktif, Hadir minggu ini, Absensi belum diisi, Pendaftar menunggu), bar chart attendance per class, "Perlu tindakan" list with deep links, recent activity from `audit_log`.
- `AD-02` Laporan hadir: filters Semester, Kelas, Pertemuan; matrix with check, cross, dash; export Excel and PDF that respects the filters.
- `AD-03` Akun dan peran: users table, drawer "Ubah peran", audit note. A user cannot remove their own last admin role.
- `AD-04` Keluarga: search, status badges, "Selesaikan" for corrections, bulk import from Excel with duplicate detection.
- `AD-05` Persetujuan EPK: list with parent and teacher status; "Setujui dan terbitkan" enabled only when both are sent; publishing notifies the parent.
- `AD-06` Review of lessons: approve and schedule, or request revision (note goes to Kurikulum).

### 10.6 Admissions (AM)

- `AM-01` Public form, three steps with stepper: (1) Data pasangan, (2) Data individu (tabs Suami, Istri, each with a referee), (3) Jurnal (prompts, text area, word count, autosave). Drafts are saved by email or phone link. Error example: "Nomor WA belum diisi".
- `AM-02` On submit: create `applications` (status Pending), create two reference tokens, send reference links by WhatsApp or email, show "Terima kasih" and status link.
- `AM-03` Status page: timeline Formulir terkirim, Pemeriksaan berkas, Referensi n dari 2, Wawancara, Keputusan. Variants Pending and Perlu Jawaban (red banner with "Lengkapi data"); Active shows the welcome message.
- `AM-04` Referee form: one-time link, six questions, Siap, Perlu pendampingan, Belum siap, consent checkbox. After use the link is dead.
- `AM-05` Admin list: status chips with counts, search, table, Detail. Detail tabs: Ringkasan, Formulir suami, Formulir istri, Referensi, Jurnal, Wawancara, Riwayat status.
- `AM-06` Actions: Minta data tambahan (sets Perlu Jawaban, sends note), Jadwalkan wawancara (interviewer, date, time, place; sends invitations), Putuskan (Diterima or Tidak diterima; rejection message is gentle and pre-approved).
- `AM-07` Pembaca jurnal: assigned list, reading view, notes, "Tandai selesai".
- `AM-08` Pewawancara: scheduled list, ratings 1 to 5 (Kesiapan, Komitmen, Kesesuaian), recommendation, notes, save sets status Selesai.
- `AM-09` Halaman Pasangan: cards per couple with class badge (replaces the empty page in the old app).
- `AM-10` Accepted couples get an invoice (section 10.7). When paid, status becomes Active, a parent account is created, and an invitation is sent.

### 10.7 Finance (FN)

- `FN-01` Invoice table: Menunggu, Bukti diunggah, Lunas; KPI cards; "Verifikasi" marks paid and notifies the payer.
- `FN-02` Payers upload a transfer proof (private bucket). No payment gateway in v1 (`OPEN Q-07`).
- `FN-03` Monthly report with Excel export. Amounts in the demo are samples.
- `ASSUMPTION A-06` Bendahara scope: invoices, payment verification, reports.

### 10.8 Konseling (KN)

- `KN-01` Konseli form: for whom (Diri sendiri, Pasangan, Keluarga), name or initials, WhatsApp, need chips, story, preferred time, consent. Success shows code `KN-0xxx`. Banner: "Ceritamu hanya dibaca konselor yang ditugaskan".
- `KN-02` Admin Konseling sees code, name or initials, need, date, status, konselor, session date. **Never** the story or notes. A lock banner states this. Urgent requests are flagged.
- `KN-03` Assign konselor (modal: konselor, first session date). Status becomes Dijadwalkan and the konselor is notified without content.
- `KN-04` Konselor sees only assigned cases, the story, previous notes, writes new notes, Tutup kasus. Banner: "Hanya Anda yang dapat membaca catatan ini".
- `KN-05` Encryption: `story` and `notes.body` encrypted at the application layer (key held in a server secret, rotated yearly). Access to these columns is logged.
- `KN-06` Pengurus sees counts only (for example "3 permintaan konseling baru").

### 10.9 Communication and Mar-com (CM)

- `CM-01` Pengumuman: audience by Peran, Kelas SK, Kelompok KTB, Usia anak; live recipient count (count only); subject, body, channels Email, Notifikasi, WhatsApp (only opted-in); phone preview; Kirim sekarang; Riwayat tab.
- `CM-02` Blocked audience: selecting Konseli shows "Pesan massal ke Konseli tidak diizinkan demi privasi." and disables sending.
- `CM-03` Mass sends require Pengurus approval in production (`ASSUMPTION A-07`); demo sends immediately.
- `CM-04` Kalender konten: kanban Draf, Ditinjau, Disetujui, Terbit; format tags Artikel, Podcast, Instagram, TikTok; due date and owner; one next-step button per card. Posting rhythm and channel plans are tracked outside the app in v1.

### 10.10 KTB (KT)

- `KT-01` Member: group card, next meeting, "Beri tahu berhalangan" (notifies facilitator), materials.
- `KT-02` Fasilitator: members list, attendance toggles, notes, "n dari 8 hadir", save updates the department recap.
- `KT-03` Admin KTB: group table, create group, assign facilitator, manage members.
- `KT-04` Head department: attendance chart per group (aggregate).
- `KT-05` Pembicara (speaker): sees schedule and materials for their sessions.

### 10.11 Events (EV)

- `EV-01` Peserta: event card with capacity, session chips, "Daftar sekarang", QR ticket. Full event shows "Penuh" and a waitlist.
- `EV-02` Panitia: scanner (camera QR), "Pindai kartu", check-in list with progress; duplicate scans are flagged.
- `EV-03` Admin Event: create event, sessions, capacity, participants table, export.

### 10.12 Staff and HR (ST)

- `ST-01` Staf: attendance (Hadir, WFH, Izin; Masuk and Pulang), leave balance, "Ajukan cuti", my requests with status.
- `ST-02` Head department approves or rejects; approval moves the request to HRD.
- `ST-03` HRD verifies; the balance is reduced automatically on verification.
- `ST-04` Evaluasi diri with stages and rating. `OPEN Q-12`: meaning of the K, A1, A2 evaluation scheme.

### 10.13 Management (PG)

- `PG-01` "Eunike Hari Ini": KPIs (Keluarga aktif, Program berjalan, Staf aktif, Acara minggu ini), attendance per program, "Perlu perhatian" list with counts only, footnote "Ringkasan ini tidak menampilkan data pribadi keluarga atau isi konseling."
- `PG-02` Reads only aggregate views. No drill-down to personal records.

### 10.14 Platform-wide (PL)

- `PL-01` Notifications: in-app plus email; WhatsApp where opted in and a provider is chosen (`OPEN Q-11`).
- `PL-02` Global search respects access.
- `PL-03` Audit log viewer for super_admin: who changed roles, who exported data.
- `PL-04` Data export per family and per module (admin tool).
- `PL-05` Empty, loading, and error states on every list (section 5.3).

### 10.15 Website CMS (WS)

Replaces the prototype `admin.html` (localStorage) with Supabase. Keep its structure: Writing, Photos, Links, Backup and restore.

- `WS-01` Writing: every editable text field has EN and ID side by side; draft and published versions; preview.
- `WS-02` Photos: upload to `site-media` or paste a URL; alt text in EN and ID is required.
- `WS-03` Links: email, website, Instagram, WhatsApp, and other destinations.
- `WS-04` Backup and restore: export all content as JSON, import a previous export (validated, previewed before applying).
- `WS-05` Reset to published; "Saved" indicator; version history (last 20).
- `WS-06` Access: markom and super_admin. Public pages read only published content and are statically regenerated on publish.

---

## 11. Cross-role workflows (state machines)

Each workflow needs one Playwright test that walks it with fake data.

1. **Admissions.** Calon submits (Pending) → referees answer (refs 2/2) → admin: Minta data (Perlu Jawaban) → calon completes (Pending) → Pembaca jurnal done → admin schedules interview (Interview) → Pewawancara saves result (Selesai) → admin decides. Diterima creates an invoice; Bendahara verifies; status Active; parent account and invitation created. Tidak diterima sets Rejected with a gentle message. Calon may cancel (Batal) before the decision.
2. **Lesson publishing.** Kurikulum draft → sends to admin (Ditinjau) → admin approves (Terjadwal) or requests revision (note back to Draf) → job publishes at `publish_at` (Terbit) → parents get a notification.
3. **Data correction.** Parent confirms or sends a correction → Admin SK resolves → parent status bar updates.
4. **EPK.** Parent 5G sent → guru reflection and 4P sent → admin approves and publishes → parent is notified and views with PIN.
5. **Counseling.** Konseli submits (Baru) → admin assigns (Dijadwalkan) → konselor writes notes (Berjalan) → closes (Ditutup). Admin and Pengurus never see content.
6. **Leave.** Staf requests → Head approves (or rejects) → HRD verifies → balance reduced.
7. **Event.** Peserta registers → QR ticket → Panitia scans (Hadir) → Admin sees live counts. Full events accept a waitlist.
8. **Content calendar.** Draf → Ditinjau → Disetujui → Terbit.

---

## 12. Non-functional requirements

- **Performance:** screens that took 4 to 5 seconds in the pilot must load under 1.5 seconds on a mid-range phone on 4G (p75). Lighthouse performance 90 or better on the public site. Paginate every list; no full-table scans.
- **Security:** OWASP ASVS level 2 as the checklist. Secrets only in environment variables. Rate limits on login, forms, and token endpoints. File uploads validated by type and size, virus scan where available.
- **Accessibility:** WCAG 2.1 AA; automated axe checks in CI plus a manual screen reader pass on login, lesson flow, and registration form.
- **Reliability:** error tracking (for example Sentry) with PII scrubbing; uptime check on `/masuk` and `/`.
- **Observability:** structured logs without personal data; audit log for sensitive actions.
- **i18n:** all UI strings in `messages/id.json` and `messages/en.json`; dates and numbers use `id-ID`.
- **Browser support:** current Chrome, Safari, Edge, Firefox; iOS Safari 16 and Android Chrome 110 or newer.
- **Offline:** not required in v1. Lesson pages should tolerate a dropped connection and retry saves.

---

## 13. Migration from the SK Batita pilot

1. Do not migrate mid-semester (D5). The pilot keeps EPK for Jul to Dec 2026.
2. Read access to the Google Sheets and Drive is needed for field mapping (`OPEN Q-14`). Map `Keluarga`, `Anak`, `Sesi`, `Absensi`, `AbsensiJul-Des26`, lessons L1 to L12, Memory Marker, forum, EPK.
3. Write an idempotent import script (`/scripts/import-pilot`) that can run many times, reports duplicates, and never overwrites newer app data.
4. Known pilot problems to fix, not copy: two attendance sources (merge into `sk_attendance`), semester hard-coded as `2026-JUL-DEC` (use `semesters`), sessions stored as a plain sheet (use `sk_meetings`), no KBK number (add `kbk_number` to families if confirmed).
5. Run both systems in parallel for two weeks at the semester boundary, compare attendance totals, then switch.

---

## 14. Delivery phases (build in this order)

Each phase ends with a deployed preview, a passing CI, and a short demo video.

**Phase 0: Foundation**
- Repo, CI, three environments, Supabase projects (staging, production), migrations, seed script, error tracking.
- Design system components (5.4) and the two themes.
- Auth (Google, family login, magic link), roles, access interception, `/masuk`, `/akses-ditolak`, role switcher, audit log.
- Port the public website exactly (6.1), then apply fixes F-01 to F-16.
- Done when: website visual test passes, a seeded user of each role lands on the right home, an unauthorized role is blocked in UI **and** at the database (tests).

**Phase 1: SK parity (the pilot, rebuilt)**
- CO-01 to CO-10 (basic), SK-01 to SK-13, GU-01 to GU-05, KU-01 to KU-04, AD-01 to AD-06.
- Import script and a rehearsal import with fake data.
- Done when: a parent completes lesson 11 end to end on a phone; a guru saves attendance for 12 families in under 3 seconds; Admin publishes EPK; parity checklist (SK-13) fully ticked.

**Phase 2: Admissions and Finance**
- AM-01 to AM-10, FN-01 to FN-03.
- Done when: workflow 1 passes end to end in Playwright.

**Phase 3: Konseling, Communication, Website CMS**
- KN-01 to KN-06, CM-01 to CM-04, WS-01 to WS-06.
- Done when: a test proves admin, director, and super admin cannot read counseling content; the website is editable in EN and ID without code.

**Phase 4: KTB, Events, Staff**
- KT-01 to KT-05, EV-01 to EV-03, ST-01 to ST-04.

**Phase 5: Management and hardening**
- PG-01, PG-02, PL-01 to PL-05, performance tuning, accessibility pass, penetration checklist, backup restore drill, data-protection documentation, launch runbook.

Definition of done for every task: code reviewed, tests added, RLS tests where data is touched, strings translated, accessibility checked, no new design deviations, docs updated.

### 14.1 Environment variables (names only)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only), `COUNSELING_ENCRYPTION_KEY` (server only), `SITE_URL`, `WHATSAPP_PROVIDER_TOKEN` (later), `SENTRY_DSN`.

### 14.2 CLAUDE.md for the repo (put at the root)

```
# Eunike Superapp
- Follow docs/PRD_Eunike_Superapp_for_Claude_Code.md. Requirement IDs go in commit messages.
- Do not change the visual design. Reuse tokens in docs section 5. Port, don't reinterpret.
- Enforce permissions in the server and in Postgres RLS. Never rely on UI hiding.
- Never use SUPABASE_SERVICE_ROLE_KEY in client code. Never log personal data.
- Counseling content is readable only by the assigned konselor.
- UI text is Indonesian from messages/id.json; no hard-coded strings.
- Commands: pnpm dev | pnpm test | pnpm e2e | pnpm db:test | pnpm lint | pnpm typecheck
- When blocked by an OPEN question, choose the simplest reversible option and add // OPEN Q-xx.
```

---

## 15. Open questions and assumptions

Answer these before or during Phase 0. Defaults apply if unanswered.

| ID | Question | Default used |
|---|---|---|
| Q-01 | Is Next.js on Vercel acceptable for the public website too, instead of staying static HTML? | Yes, one Next.js app |
| Q-02 | Which repo is the source of truth for the website (the zip lacks `portal.html` and `admin.html`)? | The deployed repo behind the live URL |
| Q-03 | Design tokens: Eunike theme follows the website (Quicksand, pink primary); SK theme follows the SK handoff (Nunito, red). Correct? | As described in A-03 |
| Q-04 | Is WhatsApp number + child's date of birth acceptable as a login for parents, or add a PIN or OTP? | Keep for parity, add rate limits; PIN as an option |
| Q-05 | Must the Konseli form require login, or stay public with consent? | Public with consent and rate limit |
| Q-06 | Volunteer and Pendamping: are they roles? What can they do? | Disabled enum values |
| Q-07 | Payments: manual transfer proof only, or a payment gateway? | Manual proof |
| Q-08 | Website: default language, and confirmation of claims ("Since 1998", principles) | Default Indonesian; claims editable |
| Q-09 | Legal review for UU PDP and storing children's data in Singapore | Required before real data |
| Q-10 | Who owns the Supabase, Vercel, and GitHub accounts (organization email, 2FA)? | Two owners on org email |
| Q-11 | WhatsApp messaging provider and budget; otherwise email and in-app only | Email and in-app first |
| Q-12 | Meaning of K, A1, A2 in the staff evaluation | Three generic stages |
| Q-13 | When do paths become subdomains on `eunikefamily.org`? | Later; routes centralized |
| Q-14 | Read access to the pilot Google Sheets and Drive, and the real content for Ayat, Sharing, and PoWeR tabs | Sample content |
| Q-15 | Do Eureka Christian School and HS4Life get program pages or link to their own sites? | Link out |
| A-04 | Email magic link for people without Google | Yes |
| A-05 | Session lifetimes (30 days parent, 12 hours staff) | As stated |
| A-06 | Bendahara scope | Invoices, verification, reports |
| A-07 | Mass announcements need Pengurus approval in production | Yes |

---

## Appendix A. Demo screen index (reference for each requirement)

Parent and SK: login, Pilih peran, Eunike Home, Beranda SK, Data Keluarga, Alur, Cerita, Cerita layar penuh, Ayat, Sharing, PoWeR, Pelajaran selesai, Memory Marker, Jadwal, Keluarga Saya, Kartu anggota, Daftar anak ke grup, Laporan semester, Notifikasi, Pencarian, Pengaturan, Parenting, KTB, Acara.
Guru: Home, Kelas, Absensi, Memory Marker kelas, Forum, Refleksi.
Kurikulum: Materi, Editor, Jadwal terbit, Pustaka.
Admin SK: Dasbor, Keluarga, Grup, Laporan hadir, Persetujuan EPK, Akun dan peran.
Admissions: Pasangan, Individu, Jurnal, Terkirim, Status, Referensi, Admin daftar, Detail, Pasangan, Wawancara, Pembaca jurnal, Pewawancara, Bendahara (tagihan, laporan).
Other: Konseli, Admin Konseling, Konselor, Pengumuman, Kalender konten, KTB (fasilitator, admin, rekap), Event (peserta, panitia, admin), Staf (home, evaluasi, head, HRD), Pengurus.

## Appendix B. Sample content and seed data

Use the demo's fake data: families Santoso, Wijaya, Pranata, Saputra, Halim, Setiawan, Suryadi, Gunawan; classes Elia, Markus, Yakub, Yehuda; lessons 9 Yesus Mengampuniku, 10 Yesus Menghiburku, 11 Yesus Memberi Sukacita (Zakheus, Lukas 19:5); KTB groups Kasih, Damai, Sukacita; event Celebration SK, 14 Nov 2026. The lesson images and logo in the demo are crops of mockups; replace them with official files before any public use.

## Appendix C. Glossary

SK Sahabat Kristus (family lessons) · KTB small group · EPK laporan semester · 5G Growth, Gladness, Gratitude, God, Guidance · 4P Pengamatan, Peneguhan, Percakapan, Pendampingan · Memory Marker family moment submission · PoWeR weekly family action · RLS row-level security · Konseli person asking for counseling · Konselor counselor.
