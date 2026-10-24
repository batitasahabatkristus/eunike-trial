-- Phase 1 RLS and function tests (PRD AC-02, §9.3, §11). Runs after rls.sql in the same database; every block rolls back.
\set ON_ERROR_STOP on
\set rina    '00000000-0000-4000-8000-000000000001'
\set daniel  '00000000-0000-4000-8000-000000000002'
\set mayaw   '00000000-0000-4000-8000-000000000003'
\set sari    '00000000-0000-4000-8000-000000000004'
\set dewi    '00000000-0000-4000-8000-000000000005'
\set ana     '00000000-0000-4000-8000-000000000007'
\set ari     '00000000-0000-4000-8000-000000000010'
\set mayak   '00000000-0000-4000-8000-000000000015'
\set fam_s   '10000000-0000-4000-8000-000000000001'
\set fam_w   '10000000-0000-4000-8000-000000000002'
\set fam_sap '10000000-0000-4000-8000-000000000004'
\set fam_set '10000000-0000-4000-8000-000000000006'
\set kayla   '11000000-0000-4000-8000-000000000001'
\set niko    '11000000-0000-4000-8000-000000000002'
\set elia    '30000000-0000-4000-8000-000000000001'
\set markus  '30000000-0000-4000-8000-000000000002'
\set yakub   '30000000-0000-4000-8000-000000000003'
\set sem     '20000000-0000-4000-8000-000000000001'
\set l11     '40000000-0000-4000-8000-000000000011'
\set l12     '40000000-0000-4000-8000-000000000012'
\set l13     '40000000-0000-4000-8000-000000000013'

select t.ok(not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity), 'SK: RLS enabled on every public table');

-- ================================================================ parent isolation
begin;
set local role authenticated; select t.as_user(:'rina');
select t.ok((select count(*) from public.lesson_progress) = 3, 'parent reads only own lesson progress');
select t.ok((select count(*) from public.lessons) = 3, 'parent sees only published lessons (9, 10, 11)');
select t.ok((select count(*) from public.lesson_steps where lesson_id = :'l12') = 0, 'parent cannot read steps of an unpublished lesson');
select t.ok((select count(*) from public.lesson_steps where lesson_id = :'l11') = 24, 'parent reads all 24 steps of a published lesson');
select t.ok((select count(*) from public.lesson_scenes where lesson_id = :'l11') = 5, 'parent reads the 5 scenes');
select t.ok((select count(*) from public.sharing_posts) = 5, 'parent sees the class sharing posts');
select t.ok((select count(*) from public.memory_markers) = 2, 'parent reads only own Memory Markers');
select t.ok((select count(*) from public.sk_attendance) >= 1 and not exists (select 1 from public.sk_attendance where family_id <> :'fam_s'), 'parent reads only own attendance rows');
select t.ok((select count(*) from public.epk_reports) = 0, 'parent cannot read the raw EPK table');
select t.ok((select count(*) from public.data_corrections) = 0, 'parent sees no other family corrections');
select t.ok((select count(*) from public.content_items) = 5, 'parent reads published parenting items only');
select t.throws($$insert into public.sharing_posts(class_id, lesson_id, family_id, body) values ('30000000-0000-4000-8000-000000000001','40000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000002','as someone else')$$, 'parent cannot post as another family');
select t.throws($$insert into public.sharing_posts(class_id, lesson_id, family_id, body) values ('30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000011','10000000-0000-4000-8000-000000000001','wrong class')$$, 'parent cannot post into a class they are not in');
insert into public.sharing_posts(class_id, lesson_id, family_id, body) values (:'elia', :'l11', :'fam_s', 'Kami bersyukur hari ini.');
select t.ok((select count(*) from public.sharing_posts) = 6, 'parent can post to their own class');
update public.sharing_posts set hidden = true where family_id = :'fam_s';
select t.ok(not exists (select 1 from public.sharing_posts where hidden), 'a parent cannot hide posts (the update changes nothing)');
insert into public.sharing_likes(post_id, family_id) values ('50000000-0000-4000-8000-000000000001', :'fam_s');
select t.throws($$insert into public.sharing_likes(post_id, family_id) values ('50000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000001')$$, 'one like per family per post');
select t.throws($$insert into public.lessons(number, title) values (99, 'x')$$, 'parent cannot create lessons');
select t.throws($$insert into public.memory_markers(family_id, child_id, lesson_id) values ('10000000-0000-4000-8000-000000000002','11000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000011')$$, 'parent cannot write another family''s Memory Marker');
rollback;

-- cross-class isolation: Markus parent sees no Elia community
begin;
set local role authenticated; select t.as_user(:'dewi');
select t.ok((select count(*) from public.sharing_posts) = 0, 'a parent in another class sees no posts from Elia');
select t.ok((select count(*) from public.forum_posts) = 0, 'a parent in another class sees no forum replies from Elia');
select t.ok((select count(*) from public.sk_class_members) = 1, 'parent sees only own class membership');
rollback;

-- ================================================================ data corrections
begin;
set local role authenticated; select t.as_user(:'ana');
select t.ok((select data_status from public.families where id = :'fam_set') = 'cek', 'Setiawan starts as "perlu dicek"');
select public.confirm_family_data(:'fam_set');
select t.ok((select data_status from public.families where id = :'fam_set') = 'ok', 'parent confirms data');
select public.submit_family_correction(:'fam_set', 'Nomor WhatsApp Papa berubah');
select t.ok((select data_status from public.families where id = :'fam_set') = 'cor', 'a correction flips the status');
select t.throws($$select public.confirm_family_data('10000000-0000-4000-8000-000000000001')$$, 'parent cannot confirm another family');
select t.throws($$select public.resolve_family_correction('10000000-0000-4000-8000-000000000006')$$, 'parent cannot resolve corrections');
reset role; set local role authenticated; select t.as_user(:'ari');
select public.resolve_family_correction(:'fam_set');
select t.ok((select data_status from public.families where id = :'fam_set') = 'ok', 'admin resolves the correction');
reset role;
select t.ok(exists (select 1 from public.notifications where profile_id = :'ana' and title like 'Koreksi data%'), 'the family is notified');
rollback;

-- ================================================================ guru scope
begin;
set local role authenticated; select t.as_user(:'daniel');
select t.ok((select count(*) from public.families) = 4, 'guru Elia reads the 4 Elia families (own included)');
select t.ok((select count(*) from public.memory_markers) = 7, 'guru Elia reads all Elia Memory Markers');
select t.ok((select count(*) from public.memory_markers where family_id = :'fam_sap') = 0, 'guru Elia reads nothing from Markus');
select t.throws($$update public.memory_markers set q1 = 'rewritten' where family_id = '10000000-0000-4000-8000-000000000003'$$, 'guru cannot rewrite a family''s answers');
update public.memory_markers set is_new = false where family_id = '10000000-0000-4000-8000-000000000003' and lesson_id = :'l11';
select t.ok((select is_new from public.memory_markers where family_id = '10000000-0000-4000-8000-000000000003' and lesson_id = :'l11') = false, 'guru can mark a Memory Marker as read');
update public.sharing_posts set hidden = true, pinned = false where id = '50000000-0000-4000-8000-000000000003';
select t.ok((select hidden from public.sharing_posts where id = '50000000-0000-4000-8000-000000000003'), 'guru can hide a post');
select t.throws($$update public.sharing_posts set body = 'edited' where id = '50000000-0000-4000-8000-000000000003'$$, 'guru cannot edit a post body');
insert into public.forum_posts(class_id, lesson_id, author_id, display_name, body) values (:'elia', :'l11', :'daniel', 'Kak Daniel (guru)', 'Terima kasih!');
select t.throws($$insert into public.forum_posts(class_id, lesson_id, author_id, display_name, body) values ('30000000-0000-4000-8000-000000000002','40000000-0000-4000-8000-000000000011','00000000-0000-4000-8000-000000000002','x','not my class')$$, 'guru cannot reply in another class');
select t.ok((select count(*) from public.sk_attendance) > 0, 'guru reads class attendance');
select t.ok((select count(*) from public.epk_reports) = 1, 'guru reads class EPK rows');
reset role;
set local role authenticated; select t.as_user(:'rina');   -- hidden posts vanish for parents
select t.ok((select count(*) from public.sharing_posts where id = '50000000-0000-4000-8000-000000000003') = 0, 'a hidden post disappears for parents');
rollback;

begin;
set local role authenticated; select t.as_user(:'sari');   -- teaches Markus, is also a parent in Elia
select t.ok((select count(*) from public.families) = 3, 'guru Markus reads Saputra, Halim and own family only');
select t.ok((select count(*) from public.memory_markers where family_id = :'fam_s') = 0, 'guru Markus cannot read Santoso Memory Markers');
select t.throws($$select public.ensure_meeting('30000000-0000-4000-8000-000000000001', '2026-11-28')$$, 'guru cannot open a meeting in a class they do not teach');
rollback;

begin;
set local role authenticated; select t.as_user('00000000-0000-4000-8000-000000000016');   -- Bima: guru role deactivated
select t.ok((select count(*) from public.children) = 0, 'a deactivated guru reads nothing');
rollback;

-- ================================================================ attendance (GU-02): atomic, scoped, fast
begin;
set local role authenticated; select t.as_user(:'daniel');
select t.ok(public.ensure_meeting(:'elia', '2026-10-31') is not null, 'guru opens the 31 Oct meeting');
select t.ok(public.save_attendance(
  (select id from public.sk_meetings where class_id = :'elia' and held_on = '2026-10-31'),
  (select jsonb_agg(jsonb_build_object('kind','family','family_id', f.id, 'status', case when f.name in ('Santoso','Wijaya') then 'in' else 'out' end))
     from public.families f join public.sk_class_members m on m.family_id = f.id where m.class_id = :'elia')) = 4, 'save_attendance writes all rows in one call');
select t.ok((select count(*) from public.sk_attendance a join public.sk_meetings m on m.id = a.meeting_id where m.held_on = '2026-10-31' and m.class_id = :'elia' and a.status = 'in') = 2, 'attendance saved with the right statuses');
select public.save_attendance((select id from public.sk_meetings where class_id = :'elia' and held_on = '2026-10-31'),
  '[{"kind":"pendamping","name":"Ibu Ruth","status":"in"}]'::jsonb);
select t.ok((select count(*) from public.sk_attendance a where a.kind = 'pendamping') = 1, 'pendamping rows share the same table');
reset role; set local role authenticated; select t.as_user(:'sari');
select t.throws($$select public.save_attendance((select id from public.sk_meetings where class_id = '30000000-0000-4000-8000-000000000001' and held_on = '2026-10-31'), '[]'::jsonb)$$, 'guru of another class cannot save attendance');
reset role; set local role authenticated; select t.as_user(:'rina');
select public.report_family_attendance((select id from public.sk_meetings where class_id = :'elia' and held_on = '2026-10-31'), :'fam_s', '{"papa":true,"mama":true,"kayla":true}'::jsonb);
select t.ok((select family_report->>'mama' from public.sk_attendance a join public.sk_meetings m on m.id = a.meeting_id where a.family_id = :'fam_s' and m.held_on = '2026-10-31') = 'true', 'family self-report is stored');
select t.throws($$select public.report_family_attendance((select id from public.sk_meetings where class_id = '30000000-0000-4000-8000-000000000001' and held_on = '2026-10-31'), '10000000-0000-4000-8000-000000000002', '{}'::jsonb)$$, 'a family cannot report for another family');
rollback;

-- ================================================================ class registration (CO-05)
begin;
set local role authenticated; select t.as_user(:'rina');
select public.register_child_to_class(:'kayla', :'markus', 'pindahan');
select t.ok((select count(*) from public.sk_class_members where child_id = :'kayla') = 1, 'a child is in one class at a time');
select t.ok((select class_id from public.sk_class_members where child_id = :'kayla') = :'markus'::uuid, 'child moved to the chosen class');
select t.throws($$select public.register_child_to_class('11000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'anggota_baru')$$, 'a full class blocks registration');
select t.throws($$select public.register_child_to_class('11000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000002', 'anggota_baru')$$, 'a parent cannot register someone else''s child');
rollback;

-- ================================================================ lesson workflow (PRD §11.2)
begin;
set local role authenticated; select t.as_user(:'mayak');
select t.ok((select count(*) from public.lessons) = 6, 'Kurikulum reads every lesson');
update public.lessons set title = 'Judul baru 12' where id = :'l12';
update public.lessons set status = 'review' where id = :'l12';
select t.ok((select status from public.lessons where id = :'l12') = 'review', 'Kurikulum sends a draft to review');
select t.throws($$update public.lessons set status = 'scheduled', publish_at = now() + interval '1 day' where id = '40000000-0000-4000-8000-000000000012'$$, 'Kurikulum cannot schedule');
select t.throws($$update public.lessons set status = 'published' where id = '40000000-0000-4000-8000-000000000012'$$, 'nobody publishes by hand');
select t.throws($$update public.lessons set title = 'x' where id = '40000000-0000-4000-8000-000000000013'$$, 'a scheduled lesson cannot be edited');
update public.lesson_steps set body = 'x' where lesson_id = :'l11';
select t.ok(not exists (select 1 from public.lesson_steps where lesson_id = :'l11' and body = 'x'), 'a published lesson''s steps cannot be edited (the update changes nothing)');
reset role; set local role authenticated; select t.as_user(:'ari');
update public.lessons set status = 'draft', admin_note = 'Tolong perpendek ayat hafalan.' where id = :'l12';
select t.ok((select admin_note from public.lessons where id = :'l12') is not null and (select status from public.lessons where id = :'l12') = 'draft', 'admin requests a revision with a note');
reset role; set local role authenticated; select t.as_user(:'mayak');
update public.lessons set status = 'review' where id = :'l12';
select t.ok((select status from public.lessons where id = :'l12') = 'review', 'Kurikulum resubmits after the revision');
reset role; set local role authenticated; select t.as_user(:'ari');
select t.throws($$update public.lessons set status = 'scheduled' where id = '40000000-0000-4000-8000-000000000012'$$, 'scheduling requires a publish date');
update public.lessons set status = 'scheduled', publish_at = '2026-11-07 08:00+07' where id = :'l12';
select t.ok((select status from public.lessons where id = :'l12') = 'scheduled', 'admin approves and schedules');
update public.lessons set status = 'draft' where id = :'l13';
select t.ok((select status from public.lessons where id = :'l13') = 'draft', 'admin cancels a schedule');
-- the functions behind the admin buttons
reset role; set local role authenticated; select t.as_user(:'ari');
update public.lessons set status = 'draft' where id = :'l13';
select t.throws($$select public.approve_lesson('40000000-0000-4000-8000-000000000014')$$, 'approve needs a publish date');
select public.approve_lesson(:'l13');
select t.ok((select status from public.lessons where id = :'l13') = 'scheduled', 'approve_lesson schedules');
select public.request_lesson_revision(:'l13', 'Perpendek ayat.');
select t.ok((select status from public.lessons where id = :'l13') = 'draft' and (select admin_note from public.lessons where id = :'l13') = 'Perpendek ayat.', 'request_lesson_revision returns it with a note');
select t.throws($$select public.request_lesson_revision('40000000-0000-4000-8000-000000000013', '  ')$$, 'a revision needs a note');
reset role; set local role service_role;
select t.ok(exists (select 1 from public.notifications where profile_id = :'mayak' and title like 'Revisi diminta%'), 'Kurikulum is notified of the revision');
reset role; set local role authenticated; select t.as_user(:'mayak');
select t.throws($$select public.approve_lesson('40000000-0000-4000-8000-000000000013')$$, 'Kurikulum cannot approve');
reset role; set local role authenticated; select t.as_user(:'daniel');
select t.ok((select count(*) from public.lessons) = 3, 'guru reads published lessons only');
update public.lessons set title = 'x' where id = :'l11';
select t.ok(not exists (select 1 from public.lessons where title = 'x'), 'guru cannot edit lessons (the update changes nothing)');
rollback;

begin;   -- the publishing job
set local role service_role;
update public.lessons set publish_at = now() - interval '1 minute' where id = :'l13';
select t.ok(public.publish_due_lessons() = 1, 'job publishes the due lesson');
select t.ok((select status from public.lessons where id = :'l13') = 'published', 'status is now published');
select t.ok(exists (select 1 from public.notifications where profile_id = :'rina' and title = 'Pelajaran 13 sudah terbit'), 'parents are notified');
select t.ok(public.publish_due_lessons() = 0, 'running the job twice publishes nothing more');
reset role; set local role authenticated; select t.as_user(:'rina');
select t.throws($$select public.publish_due_lessons()$$, 'clients cannot call the publishing job');
rollback;

-- ================================================================ EPK (PRD §11.4)
begin;
set local role authenticated; select t.as_user(:'rina');
select public.submit_parent_epk(:'kayla', :'sem', '{"g":"a","gl":"b","gr":"c","go":"d","gd":"e"}'::jsonb);
select t.ok((select status from public.v_epk_family where child_id = :'kayla') = 'parent_sent', 'parent 5G sent');
select t.ok((select teacher_5g from public.v_epk_family where child_id = :'kayla') is null, 'teacher notes are hidden from the family');
select t.throws($$select public.publish_epk((select id from public.epk_reports limit 1))$$, 'a parent cannot publish');
reset role; set local role authenticated; select t.as_user(:'sari');
select t.throws($$select public.submit_teacher_epk('11000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '{}'::jsonb, '{}'::jsonb)$$, 'a guru from another class cannot write the reflection');
reset role; set local role authenticated; select t.as_user(:'daniel');
select public.submit_teacher_epk(:'kayla', :'sem', '{"note":"Aktif"}'::jsonb, '{"a":"1","b":"2","c":"3","d":"4"}'::jsonb);
select t.ok((select status from public.epk_reports where child_id = :'kayla') = 'ready', 'both sides sent -> ready');
reset role; set local role authenticated; select t.as_user(:'rina');
select t.ok((select teacher_5g from public.v_epk_family where child_id = :'kayla') is null, 'still hidden until published');
reset role; set local role authenticated; select t.as_user(:'ari');
select public.publish_epk((select id from public.epk_reports where child_id = :'kayla'));
select t.ok((select status from public.epk_reports where child_id = :'kayla') = 'published', 'admin publishes');
reset role; set local role authenticated; select t.as_user(:'rina');
select t.ok((select teacher_5g->>'note' from public.v_epk_family where child_id = :'kayla') = 'Aktif', 'family now sees teacher notes');
select t.ok(exists (select 1 from public.notifications where profile_id = :'rina' and title like 'Laporan semester Kayla%'), 'family notified');
select t.throws($$select public.submit_parent_epk('11000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', '{}'::jsonb)$$, 'published reports cannot be changed');
reset role; set local role authenticated; select t.as_user(:'mayaw');
select t.ok((select count(*) from public.v_epk_family) = 1 and not exists (select 1 from public.v_epk_family where child_id = :'kayla'), 'another family cannot read Kayla''s report');
rollback;
begin;   -- publish needs both sides
set local role authenticated; select t.as_user(:'rina');
select public.submit_parent_epk(:'kayla', :'sem', '{"g":"a"}'::jsonb);
reset role; set local role authenticated; select t.as_user(:'ari');
select t.throws($$select public.publish_epk((select id from public.epk_reports where child_id = '11000000-0000-4000-8000-000000000001'))$$, 'cannot publish before the teacher has sent');
rollback;

-- ================================================================ PIN
begin;
set local role authenticated; select t.as_user(:'rina');
select t.ok(public.verify_family_pin(:'fam_s', '1234'), 'seed PIN verifies');
select t.ok(not public.verify_family_pin(:'fam_s', '0000'), 'wrong PIN fails');
select public.set_family_pin(:'fam_s', '4321');
select t.ok(public.verify_family_pin(:'fam_s', '4321') and not public.verify_family_pin(:'fam_s', '1234'), 'PIN can be changed');
select t.throws($$select public.set_family_pin('10000000-0000-4000-8000-000000000001', '12ab')$$, 'PIN must be four digits');
select t.ok(not public.verify_family_pin(:'fam_w', '1234'), 'cannot verify another family''s PIN');
select t.throws($$select pin_hash from public.family_pins$$, 'PIN hashes are not readable');
rollback;

-- ================================================================ Memory Marker files
select count(*) as nb from public.notifications where profile_id = :'daniel' and title like 'Memory Marker baru%' \gset
begin;
set local role authenticated; select t.as_user(:'rina');
insert into public.memory_markers(family_id, child_id, lesson_id, q1) values (:'fam_s', :'kayla', :'l11', 'Kami memasak bersama.');
insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes)
  select id, 'mm/a.jpg', 'image/jpeg', 1000 from public.memory_markers where family_id = :'fam_s' and lesson_id = :'l11';
insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes)
  select id, 'mm/b.jpg', 'image/jpeg', 1000 from public.memory_markers where family_id = :'fam_s' and lesson_id = :'l11';
insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes)
  select id, 'mm/c.jpg', 'image/jpeg', 1000 from public.memory_markers where family_id = :'fam_s' and lesson_id = :'l11';
select t.throws($$insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes) select id, 'mm/d.jpg', 'image/jpeg', 1000 from public.memory_markers where family_id = '10000000-0000-4000-8000-000000000001' and lesson_id = '40000000-0000-4000-8000-000000000011'$$, 'at most 3 files per Memory Marker');
reset role; set local role service_role;
select t.ok((select count(*) from public.notifications where profile_id = :'daniel' and title like 'Memory Marker baru%') = :nb + 1, 'the class teacher is notified of a new Memory Marker');
reset role; set local role authenticated; select t.as_user(:'rina');
select t.throws($$insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes) select id, 'mm/big.mp4', 'video/mp4', 60000000 from public.memory_markers where family_id = '10000000-0000-4000-8000-000000000001' and lesson_id = '40000000-0000-4000-8000-000000000010'$$, 'files over 50 MB are rejected');
rollback;

-- ================================================================ roles (AD-03)
begin;
set local role authenticated; select t.as_user(:'ari');
insert into public.user_roles(profile_id, role) values (:'ana', 'sk_guru');
select t.ok(exists (select 1 from public.user_roles where profile_id = :'ana' and role = 'sk_guru'), 'sk_admin can grant SK roles');
select t.throws($$insert into public.user_roles(profile_id, role) values ('00000000-0000-4000-8000-000000000007', 'konselor')$$, 'sk_admin cannot grant counseling roles');
select t.throws($$insert into public.user_roles(profile_id, role) values ('00000000-0000-4000-8000-000000000007', 'super_admin')$$, 'sk_admin cannot grant super_admin');
select t.throws($$update public.user_roles set active = false where profile_id = '00000000-0000-4000-8000-000000000010' and role = 'sk_admin'$$, 'an admin cannot remove their own admin role');
reset role; set local role service_role;
select t.ok(exists (select 1 from public.audit_log where row_table = 'user_roles' and action = 'INSERT' and actor = :'ari'::uuid), 'the grant is audited');
reset role; set local role authenticated; select t.as_user(:'ari');
reset role; set local role authenticated; select t.as_user(:'daniel');
select t.throws($$insert into public.user_roles(profile_id, role) values ('00000000-0000-4000-8000-000000000002', 'sk_admin')$$, 'a guru cannot grant themselves admin');
rollback;

-- ================================================================ anonymous
begin;
set local role anon;
select t.throws($$select * from public.lessons$$, 'anon cannot read lessons');
select t.throws($$select * from public.sharing_posts$$, 'anon cannot read posts');
select t.throws($$select * from public.v_epk_family$$, 'anon cannot read reports');
select t.throws($$select public.save_attendance('00000000-0000-0000-0000-000000000000', '[]'::jsonb)$$, 'anon cannot save attendance');
rollback;

\echo ALL SK RLS TESTS PASSED

-- ================================================================ storage policies (0003)
begin;
set local role authenticated; select t.as_user(:'rina');
insert into storage.objects(bucket_id, name) values ('memory-markers', '10000000-0000-4000-8000-000000000001/40000000-0000-4000-8000-000000000011/own.jpg');
select t.throws($$insert into storage.objects(bucket_id, name) values ('memory-markers', '10000000-0000-4000-8000-000000000002/40000000-0000-4000-8000-000000000011/theirs.jpg')$$, 'a family cannot write into another family''s storage folder');
select t.throws($$insert into storage.objects(bucket_id, name) values ('memory-markers', 'not-a-uuid/x/y.jpg')$$, 'malformed storage folders are refused, not cast-errored');
select t.throws($$insert into storage.objects(bucket_id, name) values ('lesson-assets', 'x/y.jpg')$$, 'a parent cannot write lesson assets');
reset role; set local role authenticated; select t.as_user(:'mayak');
insert into storage.objects(bucket_id, name) values ('lesson-assets', '40000000-0000-4000-8000-000000000012/thumb.jpg');
select t.ok(exists (select 1 from storage.objects where name like '%thumb.jpg'), 'Kurikulum writes and reads lesson assets');
reset role; set local role authenticated; select t.as_user(:'daniel');
select t.ok(not exists (select 1 from storage.objects where bucket_id = 'lesson-assets'), 'a guru cannot list unreferenced lesson assets');
rollback;

begin;   -- guru reads a Memory Marker file only through the row that points at it
set local role service_role;
insert into storage.objects(bucket_id, name) values ('memory-markers', '10000000-0000-4000-8000-000000000003/40000000-0000-4000-8000-000000000011/joan.jpg');
insert into public.memory_marker_files(marker_id, storage_path, mime, size_bytes)
  select id, '10000000-0000-4000-8000-000000000003/40000000-0000-4000-8000-000000000011/joan.jpg', 'image/jpeg', 100 from public.memory_markers where family_id = '10000000-0000-4000-8000-000000000003' and lesson_id = '40000000-0000-4000-8000-000000000011';
reset role; set local role authenticated; select t.as_user(:'daniel');
select t.ok(exists (select 1 from storage.objects where name like '%joan.jpg'), 'the class teacher can read the family''s file');
reset role; set local role authenticated; select t.as_user(:'dewi');
select t.ok(not exists (select 1 from storage.objects where name like '%joan.jpg'), 'an unrelated family cannot read it');
rollback;
