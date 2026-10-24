# Pilot import: CSV mapping (PRD §13)

Run: `DATABASE_URL=... pnpm import:pilot scripts/import-pilot/fixtures [--dry-run]`

**The real spreadsheets were not available when this was written.** The column names below are my assumption (Q-14).
When the real exports arrive, only the header names in `apps/web/scripts/import-pilot.ts` need to change. The fixtures are invented people.

| File | Columns | Goes to |
|---|---|---|
| Keluarga.csv | KodeKeluarga, NamaKeluarga, Papa, Mama, WhatsApp, Kelas, KBK | families (+ family_members); `pilot_ref` = KodeKeluarga |
| Anak.csv | KodeKeluarga, NamaAnak, TanggalLahir (YYYY-MM-DD or DD/MM/YYYY) | children (`pilot_ref` = kode/nama) + sk_class_members |
| Sesi.csv | Kelas, Tanggal, NomorPelajaran | sk_meetings (`pilot_ref` = kelas/tanggal) |
| Absensi.csv, AbsensiJul-Des26.csv | Kelas, Tanggal, KodeKeluarga, Status (Hadir/Tidak) | sk_attendance. The second file wins when they disagree, and the disagreement is reported |
| MemoryMarker.csv | KodeKeluarga, NamaAnak, NomorPelajaran, Q1..Q4, Kasih (`;`-separated), BicaraIman, WaktuSofa | memory_markers |
| EPK.csv | KodeKeluarga, NamaAnak, Semester, CatatanGuru, Status | epk_reports (active semester only) |

## Guarantees
- One transaction: any error rolls everything back. `--dry-run` always rolls back.
- Idempotent: second run creates 0 rows.
- App data wins: attendance already marked in the app (`marked_by` set) is never overwritten.
- Never dropped silently: duplicate WhatsApp numbers, unknown classes, unreadable dates and statuses, missing families are listed under "Perlu dicek".
- Families are imported with `data_status = 'cek'` so parents confirm their data on first login (CO-04).

## Not imported
- Forum replies (need an author account; import after teachers have logins).
- Parent login accounts: families log in with WhatsApp + child DOB (no account needed until first login).
- Photos and files.

## Open
- Q-14: real column names. KBK number: stored as given, not validated.
