-- FAKE DATA ONLY (PRD §0.1, Appendix B). Safe for staging and previews. Never run against production.
insert into auth.users (id, email, raw_user_meta_data) values
  ('00000000-0000-4000-8000-000000000001', 'santoso@seed.example.test',  '{"full_name":"Keluarga Santoso"}'),
  ('00000000-0000-4000-8000-000000000002', 'wijaya@seed.example.test',   '{"full_name":"Keluarga Wijaya"}'),
  ('00000000-0000-4000-8000-000000000010', 'admin-sk@seed.example.test', '{"full_name":"Admin SK"}'),
  ('00000000-0000-4000-8000-000000000011', 'konselor@seed.example.test', '{"full_name":"Konselor Ruth"}'),
  ('00000000-0000-4000-8000-000000000012', 'konseling-admin@seed.example.test', '{"full_name":"Admin Konseling"}'),
  ('00000000-0000-4000-8000-000000000013', 'super@seed.example.test',    '{"full_name":"Super Admin"}'),
  ('00000000-0000-4000-8000-000000000014', 'pengurus@seed.example.test', '{"full_name":"Pengurus"}')
on conflict do nothing;

insert into public.user_roles (profile_id, role) values
  ('00000000-0000-4000-8000-000000000001', 'parent'),
  ('00000000-0000-4000-8000-000000000002', 'parent'),
  ('00000000-0000-4000-8000-000000000002', 'ktb_member'),
  ('00000000-0000-4000-8000-000000000010', 'sk_admin'),
  ('00000000-0000-4000-8000-000000000011', 'konselor'),
  ('00000000-0000-4000-8000-000000000012', 'konseling_admin'),
  ('00000000-0000-4000-8000-000000000013', 'super_admin'),
  ('00000000-0000-4000-8000-000000000014', 'pengurus')
on conflict do nothing;

insert into public.families (id, name, wa_number) values
  ('10000000-0000-4000-8000-000000000001', 'Santoso', '6281200000001'),
  ('10000000-0000-4000-8000-000000000002', 'Wijaya',  '6281200000002')
on conflict do nothing;

insert into public.family_members (family_id, profile_id, relation, display_name) values
  ('10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000001', 'papa', 'Papa Budi'),
  ('10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000002', 'mama', 'Mama Lina')
on conflict do nothing;

insert into public.children (family_id, name, dob) values
  ('10000000-0000-4000-8000-000000000001', 'Kayla', '2022-03-14'),
  ('10000000-0000-4000-8000-000000000002', 'Daniel', '2021-11-02')
on conflict do nothing;
