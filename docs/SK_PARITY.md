# SK parity checklist (SK-13)

Reference: `reference/demo/Eunike_Demo_Klik.html`. "Verified" means exercised on the local database (seed = fake data) by
a test or by screenshots at 390 px; Supabase Auth and storage-with-signed-URLs are not verified (no project available).

| Demo behaviour | Where | Verified by |
|---|---|---|
| Parent home: lesson, progress, ayat/PoWeR, class | `/sk/keluarga` | screenshots, e2e |
| 24-step lesson flow, age switch, story full screen, back/next, resume | `/sk/keluarga/alur` | e2e (walk lesson 11 to the end on 390 px) |
| Cerita (5 scenes with Ken Burns + narration lines) | `/sk/keluarga/cerita` | screenshots |
| Ayat hafalan, PoWeR checklist | `/ayat`, `/power` | screenshots, RLS tests |
| Sharing (post, like, privacy toggle) | `/sharing` | RLS tests (guard trigger), screenshots |
| Memory Marker (4 questions, 3 love actions, 3 files, per lesson) | `/memory-marker` | RLS tests, screenshots |
| Data keluarga: confirm / request correction | `/data` | RLS tests |
| Guru: class home, attendance (Anggota/Pendamping/Pengurus), Memory Marker inbox, forum, refleksi, lessons | `/sk/guru/*` | e2e (GU-02), RLS tests |
| Kurikulum: lesson list, 24-step editor, review, schedule, library | `/sk/kurikulum/*` | RLS tests (status workflow), screenshots |
| Admin: dashboard, attendance + export, families, groups, EPK, accounts, lessons, schedule | `/sk/admin/*` | e2e (export), RLS tests, unit (audit text) |
| Scheduled publishing | `/api/cron/publish` | RLS test `publish_due_lessons`, e2e (401 without secret) |

## Deliberate differences from the demo
- Roles, class membership and ownership are enforced by Postgres RLS; the demo hid things in the UI only.
- Attendance is one table with an audit row per save, not two sheets.
- Photos/files go to private buckets, served only to someone allowed to see the row that points at them.

## Not done / needs a decision
- Real Supabase Auth, signed uploads, MFA enforcement: untested.
- Pilot CSV column names are assumed (Q-14).
