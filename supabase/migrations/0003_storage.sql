-- Storage buckets and policies (PRD §9.3): private buckets, access decided by RLS on the caller's own session, no service-role key.
-- Skipped on a bare Postgres that has no `storage` schema (the stub in tests/00_stub_supabase.sql provides one).
do $mig$
begin
  if to_regclass('storage.objects') is null then
    raise notice 'storage schema not present; skipping bucket policies';
    return;
  end if;

  insert into storage.buckets (id, name, public) values
    ('memory-markers', 'memory-markers', false), ('lesson-assets', 'lesson-assets', false),
    ('payment-proofs', 'payment-proofs', false), ('site-media', 'site-media', true)
  on conflict (id) do nothing;

  -- Memory Marker files live under <family_id>/<lesson_id>/<file>. Families write into their own folder only.
  create policy mm_files_insert on storage.objects for insert to authenticated with check (
    bucket_id = 'memory-markers'
    and case when (storage.foldername(name))[1] ~ '^[0-9a-f-]{36}$' then public.is_family_member(((storage.foldername(name))[1])::uuid) else false end);
  -- Read follows the database row that points at the file: its own family, the class teacher, SK admins.
  create policy mm_files_select on storage.objects for select to authenticated using (
    bucket_id = 'memory-markers' and exists (select 1 from public.memory_marker_files f where f.storage_path = name));

  -- Lesson art: Kurikulum and admin write; reading follows the lesson rows that reference the file.
  create policy lesson_assets_write on storage.objects for insert to authenticated with check (
    bucket_id = 'lesson-assets' and public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[]));
  create policy lesson_assets_update on storage.objects for update to authenticated using (
    bucket_id = 'lesson-assets' and public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[]));
  create policy lesson_assets_select on storage.objects for select to authenticated using (
    bucket_id = 'lesson-assets' and (
      public.has_any_role(array['sk_kurikulum','sk_admin','super_admin']::public.app_role[])
      or exists (select 1 from public.lessons l where l.thumbnail_path = name)
      or exists (select 1 from public.lesson_scenes s where s.image_path = name)));
end
$mig$;

revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.notify(uuid, text, text, text), public.family_profiles(uuid),
  public.publish_due_lessons(), public.rate_limit_hit(text, integer, integer), public.find_family_login(text, date) from authenticated;
