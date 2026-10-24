-- FAKE DATA ONLY (PRD §0.1, Appendix B). Safe for staging, previews and tests. Never run against production.
-- Mirrors the clickable demo: families Santoso, Wijaya, Pranata, Saputra, Halim, Setiawan, Suryadi, Gunawan;
-- classes Elia, Markus, Yakub, Yehuda; lessons 9 to 11 published, 12 draft, 13 scheduled, 14 draft.

-- ------------------------------------------------------------------ people
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000001', 'rina@seed.example.test',        '{"full_name":"Rina Santoso"}'),
  ('00000000-0000-4000-8000-000000000002', 'daniel@seed.example.test',      '{"full_name":"Daniel Santoso"}'),
  ('00000000-0000-4000-8000-000000000003', 'maya.w@seed.example.test',      '{"full_name":"Maya Wijaya"}'),
  ('00000000-0000-4000-8000-000000000004', 'sari@seed.example.test',        '{"full_name":"Sari Pranata"}'),
  ('00000000-0000-4000-8000-000000000005', 'dewi@seed.example.test',        '{"full_name":"Dewi Saputra"}'),
  ('00000000-0000-4000-8000-000000000006', 'linda@seed.example.test',       '{"full_name":"Linda Halim"}'),
  ('00000000-0000-4000-8000-000000000007', 'ana@seed.example.test',         '{"full_name":"Ana Setiawan"}'),
  ('00000000-0000-4000-8000-000000000008', 'lisa@seed.example.test',        '{"full_name":"Lisa Suryadi"}'),
  ('00000000-0000-4000-8000-000000000009', 'mery@seed.example.test',        '{"full_name":"Mery Gunawan"}'),
  ('00000000-0000-4000-8000-000000000010', 'ari@seed.example.test',         '{"full_name":"Ari (Admin SK)"}'),
  ('00000000-0000-4000-8000-000000000011', 'ruth@seed.example.test',        '{"full_name":"Ruth (Konselor)"}'),
  ('00000000-0000-4000-8000-000000000012', 'konseling-admin@seed.example.test', '{"full_name":"Admin Konseling"}'),
  ('00000000-0000-4000-8000-000000000013', 'super@seed.example.test',       '{"full_name":"Super Admin"}'),
  ('00000000-0000-4000-8000-000000000014', 'pengurus@seed.example.test',    '{"full_name":"Pengurus"}'),
  ('00000000-0000-4000-8000-000000000015', 'maya.k@seed.example.test',      '{"full_name":"Maya (Kurikulum)"}'),
  ('00000000-0000-4000-8000-000000000016', 'bima@seed.example.test',        '{"full_name":"Bima (Guru, nonaktif)"}'),
  ('00000000-0000-4000-8000-000000000017', 'reg@seed.example.test',         '{"full_name":"Admin Pendaftaran"}'),
  ('00000000-0000-4000-8000-000000000018', 'bendahara@seed.example.test',   '{"full_name":"Bendahara"}'),
  ('00000000-0000-4000-8000-000000000019', 'ktb-fas@seed.example.test',     '{"full_name":"Fasilitator KTB Kasih"}'),
  ('00000000-0000-4000-8000-000000000020', 'ktb-admin@seed.example.test',   '{"full_name":"Admin KTB"}'),
  ('00000000-0000-4000-8000-000000000021', 'panitia@seed.example.test',     '{"full_name":"Panitia Celebration SK"}'),
  ('00000000-0000-4000-8000-000000000022', 'staf@seed.example.test',        '{"full_name":"Staf Eunike"}'),
  ('00000000-0000-4000-8000-000000000023', 'hrd@seed.example.test',         '{"full_name":"HRD"}'),
  ('00000000-0000-4000-8000-000000000024', 'markom@seed.example.test',      '{"full_name":"Mar-com"}'),
  ('00000000-0000-4000-8000-000000000025', 'calon@seed.example.test',       '{"full_name":"Calon Orang Tua Pranata"}'),
  ('00000000-0000-4000-8000-000000000026', 'head@seed.example.test',        '{"full_name":"Kepala Departemen"}')
on conflict do nothing;

-- ------------------------------------------------------------------ semester, classes
insert into public.semesters (id, label, starts_on, ends_on, active) values
  ('20000000-0000-4000-8000-000000000001', 'Juli – Des 2026', '2026-07-01', '2026-12-31', true);
insert into public.sk_classes (id, semester_id, name, capacity) values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'Elia',   14),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001', 'Markus', 14),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'Yakub',   2),   -- full on purpose (CO-05)
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000001', 'Yehuda', 12);

-- ------------------------------------------------------------------ roles
insert into public.user_roles (profile_id, role, scope_type, scope_id) values
  ('00000000-0000-4000-8000-000000000001', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000002', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000002', 'sk_guru', 'class', '30000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000003', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000003', 'ktb_member', 'global', null),
  ('00000000-0000-4000-8000-000000000003', 'event_participant', 'global', null),
  ('00000000-0000-4000-8000-000000000004', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000004', 'sk_guru', 'class', '30000000-0000-4000-8000-000000000002'),
  ('00000000-0000-4000-8000-000000000005', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000006', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000007', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000008', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000009', 'parent', 'global', null),
  ('00000000-0000-4000-8000-000000000010', 'sk_admin', 'global', null),
  ('00000000-0000-4000-8000-000000000011', 'konselor', 'global', null),
  ('00000000-0000-4000-8000-000000000012', 'konseling_admin', 'global', null),
  ('00000000-0000-4000-8000-000000000013', 'super_admin', 'global', null),
  ('00000000-0000-4000-8000-000000000013', 'pengurus', 'global', null),
  ('00000000-0000-4000-8000-000000000014', 'pengurus', 'global', null),
  ('00000000-0000-4000-8000-000000000015', 'sk_kurikulum', 'global', null),
  ('00000000-0000-4000-8000-000000000017', 'sk_registration_admin', 'global', null),
  ('00000000-0000-4000-8000-000000000018', 'bendahara', 'global', null),
  ('00000000-0000-4000-8000-000000000019', 'ktb_facilitator', 'global', null),
  ('00000000-0000-4000-8000-000000000020', 'ktb_admin', 'global', null),
  ('00000000-0000-4000-8000-000000000021', 'event_committee', 'global', null),
  ('00000000-0000-4000-8000-000000000022', 'staff', 'global', null),
  ('00000000-0000-4000-8000-000000000023', 'hrd', 'global', null),
  ('00000000-0000-4000-8000-000000000024', 'markom', 'global', null),
  ('00000000-0000-4000-8000-000000000025', 'prospect_parent', 'global', null),
  ('00000000-0000-4000-8000-000000000026', 'head_department', 'global', null);
insert into public.user_roles (profile_id, role, scope_type, scope_id, active) values
  ('00000000-0000-4000-8000-000000000016', 'sk_guru', 'class', '30000000-0000-4000-8000-000000000002', false);

-- ------------------------------------------------------------------ families and children
insert into public.families (id, name, wa_number, member_code, data_status) values
  ('10000000-0000-4000-8000-000000000001', 'Santoso',  '6281200001111', 'ELIA-0123',   'ok'),
  ('10000000-0000-4000-8000-000000000002', 'Wijaya',   '6281200002222', 'ELIA-0124',   'ok'),
  ('10000000-0000-4000-8000-000000000003', 'Pranata',  '6281200003333', 'ELIA-0125',   'ok'),
  ('10000000-0000-4000-8000-000000000004', 'Saputra',  '6281200004444', 'MARKUS-0201', 'cor'),
  ('10000000-0000-4000-8000-000000000005', 'Halim',    '6281200005555', 'MARKUS-0202', 'ok'),
  ('10000000-0000-4000-8000-000000000006', 'Setiawan', '6281200006666', 'YAKUB-0301',  'cek'),
  ('10000000-0000-4000-8000-000000000007', 'Suryadi',  '6281200007777', 'YAKUB-0302',  'ok'),
  ('10000000-0000-4000-8000-000000000008', 'Gunawan',  '6281200008888', 'ELIA-0126',   'ok');

insert into public.family_members (family_id, profile_id, relation, display_name) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', 'papa', 'Daniel'),
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'mama', 'Rina'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', 'mama', 'Maya'),
  ('10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000004', 'mama', 'Sari'),
  ('10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000005', 'mama', 'Dewi'),
  ('10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000006', 'mama', 'Linda'),
  ('10000000-0000-4000-8000-000000000006', '00000000-0000-4000-8000-000000000007', 'mama', 'Ana'),
  ('10000000-0000-4000-8000-000000000007', '00000000-0000-4000-8000-000000000008', 'mama', 'Lisa'),
  ('10000000-0000-4000-8000-000000000008', '00000000-0000-4000-8000-000000000009', 'mama', 'Mery');

insert into public.children (id, family_id, name, dob) values
  ('11000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Kayla',  '2024-05-12'),
  ('11000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', 'Niko',   '2023-08-02'),
  ('11000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', 'Joan',   '2024-01-20'),
  ('11000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', 'Adel',   '2023-04-09'),
  ('11000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', 'Bryan',  '2023-06-30'),
  ('11000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000006', 'Clara',  '2024-02-14'),
  ('11000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000007', 'Dion',   '2024-03-03'),
  ('11000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000008', 'Evelyn', '2024-07-21');

insert into public.sk_class_members (class_id, family_id, child_id)
select c.id, f.id, ch.id from (values
  ('Elia','1'),('Elia','2'),('Elia','3'),('Markus','4'),('Markus','5'),('Yakub','6'),('Yakub','7'),('Elia','8')) as v(cname, n)
join public.sk_classes c on c.name = v.cname
join public.families f on f.id = ('10000000-0000-4000-8000-00000000000' || v.n)::uuid
join public.children ch on ch.family_id = f.id;

insert into public.data_corrections (family_id, body) values
  ('10000000-0000-4000-8000-000000000004', 'Nomor WhatsApp Mama berubah.');

-- ------------------------------------------------------------------ lessons
insert into public.lessons (id, number, title, short_title, truth, verse_text, verse_ref, thumbnail_path, publish_at, status) values
  ('40000000-0000-4000-8000-000000000009', 9,  'Yesus Mengampuniku', 'Mengampuniku', 'Karena Yesus, aku diampuni.',
   'Yesus berkata: “Ya Bapa, ampunilah mereka, sebab mereka tidak tahu apa yang mereka perbuat.”', 'Lukas 23:34', '/assets/art9.jpg',  '2026-10-03 08:00+07', 'published'),
  ('40000000-0000-4000-8000-000000000010', 10, 'Yesus Menghiburku',   'Menghiburku',  'Karena Yesus, aku dihibur.',
   'Maka menangislah Yesus.', 'Yohanes 11:35', '/assets/art10.jpg', '2026-10-10 08:00+07', 'published'),
  ('40000000-0000-4000-8000-000000000011', 11, 'Yesus Memberi Sukacita', 'Memberi Sukacita', 'Karena Yesus, aku merasakan sukacita.',
   'Zakheus, segeralah turun, sebab hari ini Aku harus menumpang di rumahmu.', 'Lukas 19:5', '/assets/art11.jpg', '2026-10-17 08:00+07', 'published'),
  ('40000000-0000-4000-8000-000000000012', 12, 'Judul menyusul', 'Menyusul', 'Karena Yesus, aku dikasihi.', '', '', null, null, 'draft'),
  ('40000000-0000-4000-8000-000000000013', 13, 'Doa bersama keluarga', 'Doa bersama', 'Karena Yesus, aku boleh berdoa.', '', '', null, '2026-11-14 08:00+07', 'scheduled'),
  ('40000000-0000-4000-8000-000000000014', 14, 'Kasih dalam tindakan', 'Kasih', '', '', '', null, null, 'draft');

-- 24-step flow (SK-04). kind/story_scene drive the special screens.
insert into public.lesson_steps (lesson_id, position, title, body, kind, story_scene)
select l.id, v.p, v.t, v.b, v.k, v.s
from public.lessons l cross join (values
  (1,  'Sambutan', 'Hai, Mama dan Papa! Hari ini kita belajar bersama anak di rumah.', 'text', null),
  (2,  'Doa pembuka', 'Ajak anak melipat tangan. Ucapkan doa pendek: “Tuhan Yesus, ajar kami hari ini.”', 'text', null),
  (3,  'Lagu pembuka', 'Bernyanyi bersama satu lagu yang anak sukai. Boleh sambil bertepuk tangan.', 'text', null),
  (4,  'Mari bergerak', 'Lompat kecil tiga kali dan hitung bersama. Anak belajar bersiap dengan gembira.', 'text', null),
  (5,  'Kata kunci', 'Kata kunci pelajaran ini ada di judul. Ulangi pelan-pelan bersama anak.', 'text', null),
  (6,  'Pertanyaan pembuka', 'Tanya anak: “Kapan kamu merasa senang sekali?” Dengarkan jawabannya.', 'text', null),
  (7,  'Video pengantar', 'Tonton video pendek pengantar cerita bersama anak.', 'video', null),
  (8,  'Siapkan benda cerita', 'Siapkan boneka atau benda kecil untuk membantu bercerita.', 'text', null),
  (9,  'Siapkan hati', 'Tarik napas bersama. Kita siap mendengar cerita dari Alkitab.', 'text', null),
  (10, 'Sebelum bercerita', 'Bayangkan bersama: bagaimana rasanya ingin sekali melihat seseorang?', 'text', null),
  (11, 'Pengantar cerita', 'Cerita hari ini diambil dari Alkitab. Dengarkan baik-baik bersama anak.', 'text', null),
  (12, 'Cerita Alkitab', '', 'story', 1), (13, 'Cerita Alkitab', '', 'story', 2), (14, 'Cerita Alkitab', '', 'story', 3),
  (15, 'Cerita Alkitab', '', 'story', 4), (16, 'Cerita Alkitab', '', 'story', 5),
  (17, 'Bicara tentang cerita', 'Tanya anak: “Apa yang terjadi dalam cerita? Bagaimana perasaannya?”', 'text', null),
  (18, 'Ayat hafalan', 'Baca ayat pelajaran bersama.', 'ayat', null),
  (19, 'Ulangi ayat', 'Ulangi ayat tiga kali, boleh dengan gerakan tangan.', 'ayat', null),
  (20, 'Sharing keluarga', 'Ceritakan satu momen keluarga minggu ini.', 'sharing', null),
  (21, 'Aktivitas bersama anak', 'Lakukan aktivitas sederhana yang membuat keluarga bersukacita.', 'text', null),
  (22, 'PoWeR', 'Pilih satu tindakan kecil untuk dilakukan keluarga minggu ini.', 'power', null),
  (23, 'Doa penutup', 'Tutup dengan doa syukur bersama anak.', 'text', null),
  (24, 'Memory Marker', 'Abadikan momen belajar keluarga dan kirim ke guru.', 'memory_marker', null)
) as v(p, t, b, k, s)
where l.number between 9 and 13;

-- Pelajaran 11: Zakheus (the demo's worked example)
update public.lessons set goal = 'Anak menikmati kebersamaan dengan keluarga.' where number = 11;
update public.lessons set goal = 'Anak belajar bahwa Yesus menghibur kita.' where number = 10;
update public.lessons set goal = 'Anak belajar mengampuni dan diampuni.' where number = 9;
update public.lesson_steps set body = 'Cerita hari ini terjadi di kota Yerikho, tempat tinggal Zakheus.' where position = 11 and lesson_id = '40000000-0000-4000-8000-000000000011';
update public.lesson_steps set body = 'Kata kunci pelajaran ini: sukacita. Ulangi pelan-pelan bersama anak.' where position = 5 and lesson_id = '40000000-0000-4000-8000-000000000011';
update public.lesson_steps set body = 'Tanya anak: “Apa yang Zakheus lakukan? Bagaimana perasaannya saat Yesus datang?”' where position = 17 and lesson_id = '40000000-0000-4000-8000-000000000011';
update public.lesson_steps set body = 'Ceritakan satu momen sukacita keluarga minggu ini.' where position = 20 and lesson_id = '40000000-0000-4000-8000-000000000011';

insert into public.lesson_scenes (lesson_id, position, title, image_path, zoom, focus, narration_1_2, narration_2_3, narration_3_4) values
  ('40000000-0000-4000-8000-000000000011', 1, 'Zakheus ingin melihat Yesus', '/assets/s_crowd.jpg', 1, '50% 50%',
   'Zakheus ingin lihat Yesus. Banyak sekali orang!',
   'Wah, Zakheus ingin sekali melihat Yesus! Tetapi Zakheus kecil, dan ada banyak sekali orang yang menghalangi.',
   'Zakheus ingin sekali melihat Yesus. Tetapi Zakheus pendek, dan orang-orang berdiri di depannya. Zakheus tidak bisa melihat apa-apa.'),
  ('40000000-0000-4000-8000-000000000011', 2, 'Zakheus naik ke pohon', '/assets/s_tree.jpg', 1, '50% 50%',
   'Zakheus naik ke pohon. Hop! Hop!',
   'Apa yang Zakheus lakukan? Dia naik ke atas pohon! Dari atas, Zakheus bisa melihat Yesus.',
   'Zakheus punya ide! Dia berlari dan naik ke atas pohon. Dari atas pohon, Zakheus bisa melihat Yesus berjalan di antara banyak orang.'),
  ('40000000-0000-4000-8000-000000000011', 3, 'Yesus melihat Zakheus', '/assets/s_tree.jpg', 1.9, '58% 78%',
   'Yesus melihat ke atas. “Zakheus!”',
   'Yesus berhenti. Yesus melihat ke atas pohon. “Zakheus, turunlah!” kata Yesus.',
   'Tiba-tiba Yesus berhenti dan melihat ke atas. Yesus mengenal Zakheus dan memanggil namanya, “Zakheus, segeralah turun!”'),
  ('40000000-0000-4000-8000-000000000011', 4, 'Yesus datang ke rumah Zakheus', '/assets/s_home.jpg', 1, '50% 50%',
   'Yesus datang ke rumah Zakheus. Zakheus senang!',
   'Wah, Zakheus sangat bersukacita! Yesus mau menjadi sahabatnya.',
   'Zakheus turun dengan cepat. Yesus datang ke rumah Zakheus. Hati Zakheus penuh sukacita karena Yesus mau menjadi sahabatnya.'),
  ('40000000-0000-4000-8000-000000000011', 5, 'Hati yang penuh sukacita', '/assets/s_home.jpg', 1.7, '18% 40%',
   'Zakheus tersenyum lebar. Hatinya senang.',
   'Zakheus berkata, “Aku mau berbagi dengan orang lain.” Sukacita Zakheus membuat dia mau memberi.',
   'Karena Yesus, Zakheus merasakan sukacita. Zakheus mau berbagi dengan orang lain. Itulah sukacita yang Yesus berikan.');
-- lessons 9 and 10 reuse neutral scenes so every published lesson has 5
insert into public.lesson_scenes (lesson_id, position, title, image_path, zoom, focus, narration_1_2, narration_2_3, narration_3_4)
select l.id, g, 'Adegan ' || g, case g % 3 when 0 then '/assets/s_home.jpg' when 1 then '/assets/s_crowd.jpg' else '/assets/s_tree.jpg' end, 1, '50% 50%',
       'Cerita ' || l.short_title || ', adegan ' || g || '.', 'Cerita ' || l.title || ', adegan ' || g || '. Dengarkan bersama anak.',
       'Cerita ' || l.title || ', adegan ' || g || '. Ajak anak menceritakan kembali dengan kata-katanya sendiri.'
from public.lessons l, generate_series(1, 5) g where l.number in (9, 10);

insert into public.power_items (lesson_id, position, text)
select l.id, v.p, v.t from public.lessons l cross join (values
  (1, 'Berbagi sukacita dengan Papa'), (2, 'Bernyanyi bersama'), (3, 'Berdoa bersama sebelum tidur')) v(p, t)
where l.number between 9 and 11;

-- ------------------------------------------------------------------ progress (Santoso, as in the demo)
insert into public.lesson_progress (family_id, lesson_id, step, done_steps) values
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000009', 23, 24),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000010', 23, 24),
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', 14, 14);
insert into public.ayat_progress (family_id, lesson_id, items) values
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', '{t,t,f}');
insert into public.power_progress (family_id, lesson_id, items) values
  ('10000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', '{t,f,f}');
insert into public.family_pins (family_id, pin_hash) values
  ('10000000-0000-4000-8000-000000000001', crypt('1234', gen_salt('bf'))),
  ('10000000-0000-4000-8000-000000000002', crypt('1234', gen_salt('bf')));

-- ------------------------------------------------------------------ meetings and attendance (5 Saturdays, demo pattern)
insert into public.sk_meetings (class_id, lesson_id, held_on)
select c.id, l.id, d::date
from public.sk_classes c cross join (values ('2026-10-03', 9), ('2026-10-10', 10), ('2026-10-17', 11), ('2026-10-24', 11), ('2026-10-31', 11),
                                          ('2026-11-07', null), ('2026-11-14', null), ('2026-11-21', null)) v(d, ln)
left join public.lessons l on l.number = v.ln;

-- family order: Santoso, Wijaya, Pranata, Saputra, Halim, Setiawan, Suryadi, Gunawan ; first four Saturdays only
insert into public.sk_attendance (meeting_id, kind, family_id, status, marked_at)
select m.id, 'family', f.id, case p.cell when 'v' then 'in'::public.attendance_status else 'out'::public.attendance_status end, m.held_on::timestamptz
from (values
  (1, 'vvvv'), (2, 'vvxv'), (3, 'v-vv'), (4, 'vvvx'), (5, 'vvvv'), (6, 'vxvx'), (7, 'vv-v'), (8, '-vvv')) as pat(n, cells)
cross join lateral (select substr(pat.cells, k, 1) as cell, k from generate_series(1, 4) k) p
join public.families f on f.id = ('10000000-0000-4000-8000-00000000000' || pat.n)::uuid
join public.sk_class_members cm on cm.family_id = f.id
join public.sk_meetings m on m.class_id = cm.class_id
  and m.held_on = (array['2026-10-03','2026-10-10','2026-10-17','2026-10-24'])[p.k]::date
where p.cell <> '-';

-- ------------------------------------------------------------------ community
insert into public.sharing_posts (id, class_id, lesson_id, family_id, body, created_at) values
  ('50000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000001', 'Mari bagikan satu momen sukacita minggu ini.', '2026-10-17 09:15+07'),
  ('50000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000002', 'Kami menyiapkan sarapan bersama. Anak kami senang membantu.', '2026-10-17 10:12+07'),
  ('50000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000003', 'Kami bernyanyi dan berdoa bersama sebelum tidur.', '2026-10-17 10:30+07'),
  ('50000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000001', 'Kami menghibur nenek bersama-sama.', '2026-10-10 09:55+07'),
  ('50000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000002', 'Kami belajar saling memaafkan di rumah.', '2026-10-03 09:40+07');
insert into public.sharing_likes (post_id, family_id) values
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000008'),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001'),
  ('50000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002');

insert into public.memory_markers (family_id, child_id, lesson_id, q1, q2, q3, q4, love_in_action, faith_talk, couch_time, is_new, created_at) values
  ('10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000009', 'Kayla minta maaf kepada kakaknya dan mereka berpelukan.', '', '', '', '{Mengampuni}', true, false, false, '2026-10-03 10:20+07'),
  ('10000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000009', 'Kami belajar saling memaafkan di rumah.', '', '', '', '{Mengampuni}', true, true, false, '2026-10-03 10:41+07'),
  ('10000000-0000-4000-8000-000000000001', '11000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000010', 'Kami menghibur nenek yang sedang sakit.', '', '', '', '{Melayani}', true, false, false, '2026-10-10 10:05+07'),
  ('10000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000010', 'Joan memeluk adiknya yang sedih.', '', '', '', '{Melayani}', false, true, false, '2026-10-10 11:12+07'),
  ('10000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002', '40000000-0000-4000-8000-000000000011', 'Kami bernyanyi bersama. Niko ikut berdoa.', '', '', '', '{Memberi}', true, false, true, '2026-10-17 10:25+07'),
  ('10000000-0000-4000-8000-000000000003', '11000000-0000-4000-8000-000000000003', '40000000-0000-4000-8000-000000000011', 'Kami ke gereja bersama. Joan mendengar cerita Yesus.', '', '', '', '{Melayani}', true, false, true, '2026-10-17 11:03+07'),
  ('10000000-0000-4000-8000-000000000008', '11000000-0000-4000-8000-000000000008', '40000000-0000-4000-8000-000000000011', 'Evelyn berbagi mainannya dengan adik.', '', '', '', '{Memberi}', false, false, false, '2026-10-17 11:45+07');
insert into public.forum_posts (class_id, lesson_id, author_id, display_name, body, created_at) values
  ('30000000-0000-4000-8000-000000000001', '40000000-0000-4000-8000-000000000011', '00000000-0000-4000-8000-000000000002', 'Kak Daniel (guru)', 'Terima kasih sudah berbagi, Keluarga Elia!', '2026-10-17 12:00+07');

-- ------------------------------------------------------------------ EPK: Niko's report is already published (demo)
insert into public.epk_reports (family_id, child_id, semester_id, parent_5g, teacher_5g, p4, status, parent_sent_at, teacher_sent_at, published_at) values
  ('10000000-0000-4000-8000-000000000002', '11000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000001',
   '{"g":"Niko mulai berani berdoa sendiri.","gl":"Kami senang melihat Niko bernyanyi.","gr":"Kami bersyukur atas teman-teman kelas.","go":"Kami ingin Niko mengenal kasih Allah.","gd":"Kami butuh ide doa keluarga yang rutin."}',
   '{"note":"Niko aktif dan ceria di kelas."}',
   '{"a":"Niko aktif dan ceria di kelas.","b":"Niko berani maju saat bernyanyi.","c":"Ajak Niko bercerita tentang Yesus setiap malam.","d":"Tetapkan waktu doa keluarga yang rutin."}',
   'published', now(), now(), now());

-- ------------------------------------------------------------------ notifications (Rina)
insert into public.notifications (profile_id, title, body, action_url, read_at, created_at) values
  ('00000000-0000-4000-8000-000000000001', 'Pelajaran 11 sudah terbit', 'Yesus Memberi Sukacita', '/sk/keluarga', null, now() - interval '3 hours'),
  ('00000000-0000-4000-8000-000000000001', 'Absensi Kelas Elia belum diisi', 'Isi sekarang', '/beranda/jadwal', null, now() - interval '4 hours'),
  ('00000000-0000-4000-8000-000000000001', 'Jadwal KTB Kelompok Kasih berubah ke 19.30', null, '/beranda/jadwal', now(), now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000001', 'Laporan semester Kayla sudah terbit', null, '/beranda/laporan', now(), now() - interval '1 day');

-- ------------------------------------------------------------------ parenting library
insert into public.content_items (title, summary, format, status, url, published_at) values
  ('Membangun waktu iman di rumah', 'Langkah kecil setiap hari untuk keluarga.', 'article', 'published', null, now()),
  ('5 cara bercerita kepada balita', 'Cerita yang hidup, bukan dibacakan datar.', 'article', 'published', null, now()),
  ('Podcast: Tumbuh Bersama Keluarga', 'Obrolan ringan tentang iman di rumah.', 'podcast', 'published', null, now()),
  ('Lembar kegiatan Pelajaran 11', 'Panduan kegiatan pendamping Pelajaran 11.', 'guide', 'published', null, now()),
  ('Doa sebelum tidur', 'Doa pendek untuk anak.', 'article', 'published', null, now()),
  ('Draf internal: seri Natal', 'Belum terbit.', 'article', 'draft', null, null);
