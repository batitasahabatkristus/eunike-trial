-- RLS tests (PRD AC-02). Each block acts as a specific user through the same roles Supabase uses.
\set ON_ERROR_STOP on
create schema if not exists t;
create or replace function t.ok(cond boolean, msg text) returns void language plpgsql as $$
begin if cond is not true then raise exception 'FAIL: %', msg; end if; raise notice 'ok - %', msg; end $$;
create or replace function t.throws(stmt text, msg text) returns void language plpgsql as $$
begin
  begin execute stmt; exception when others then raise notice 'ok - % (%)', msg, sqlerrm; return; end;
  raise exception 'FAIL: expected error: %', msg;
end $$;
create or replace function t.as_user(uid text) returns void language plpgsql as $$
begin perform set_config('request.jwt.claim.sub', uid, true); end $$;
grant usage on schema t to anon, authenticated, service_role;
grant execute on all functions in schema t to anon, authenticated, service_role;

\set santoso '00000000-0000-4000-8000-000000000001'
\set wijaya  '00000000-0000-4000-8000-000000000003'
\set sk_admin '00000000-0000-4000-8000-000000000010'
\set konselor '00000000-0000-4000-8000-000000000011'
\set super   '00000000-0000-4000-8000-000000000013'
\set pengurus '00000000-0000-4000-8000-000000000014'

-- Every table in public must have RLS enabled.
select t.ok(not exists (select 1 from pg_tables where schemaname = 'public' and not rowsecurity),
  'RLS enabled on every public table');

-- ---- parent isolation
begin;
set local role authenticated; select t.as_user(:'santoso');
select t.ok((select count(*) from public.families) = 1, 'parent sees exactly their own family');
select t.ok((select name from public.families) = 'Santoso', 'parent sees Santoso, not Wijaya');
select t.ok((select count(*) from public.children) = 1, 'parent sees only own children');
select t.ok((select count(*) from public.family_members) = 2, 'parent sees only own family members (Papa and Mama)');
select t.ok((select count(*) from public.profiles) = 1, 'parent sees only own profile');
select t.ok((select count(*) from public.audit_log) = 0, 'parent cannot read audit log');
select t.ok((select count(*) from public.contact_messages) = 0, 'parent cannot read contact messages');
select t.ok((select count(*) from public.user_roles) = 1, 'parent sees only own role rows');
select t.throws($$insert into public.user_roles(profile_id, role) values ('00000000-0000-4000-8000-000000000001','super_admin')$$, 'parent cannot grant themselves super_admin');
select t.throws($$select * from public.rate_limits$$, 'parent cannot read rate_limits');
select t.throws($$select * from public.find_family_login('6281200001111','2024-05-12')$$, 'parent cannot call family login lookup');
select t.throws($$select public.rate_limit_hit('x',1,1)$$, 'parent cannot call rate limiter');
update public.families set name = 'Hacked' where id = '10000000-0000-4000-8000-000000000002';
select t.throws($$update public.families set wa_number = '6280000000000' where id = '10000000-0000-4000-8000-000000000001'$$, 'parent cannot change the family WhatsApp number (login key)');
rollback;
begin;
set local role service_role;
select t.ok((select name from public.families where id = '10000000-0000-4000-8000-000000000002') = 'Wijaya', 'cross-family update by parent changed nothing');
rollback;

-- ---- consent: own rows, insert only
begin;
set local role authenticated; select t.as_user(:'santoso');
insert into public.consents(profile_id, type, version) values (:'santoso', 'privacy', 'v1');
select t.ok((select count(*) from public.consents) = 1, 'parent can record own consent');
select t.throws($$insert into public.consents(profile_id, type, version) values ('00000000-0000-4000-8000-000000000003','privacy','v1')$$, 'parent cannot record consent for someone else');
select t.throws($$delete from public.consents$$, 'consent rows cannot be deleted by the user');
rollback;

-- ---- sk_admin
begin;
set local role authenticated; select t.as_user(:'sk_admin');
select t.ok((select count(*) from public.families) = 8, 'sk_admin reads all families');
select t.ok((select count(*) from public.children) = 8, 'sk_admin reads all children');
select t.throws($$insert into public.user_roles(profile_id, role) values ('00000000-0000-4000-8000-000000000010','super_admin')$$, 'sk_admin cannot escalate to super_admin');
select t.ok((select count(*) from public.audit_log where row_table not in ('lessons','epk_reports','families','sk_class_members','sk_meetings','user_roles')) = 0, 'sk_admin cannot read audit rows outside SK tables');
rollback;

-- ---- pengurus: no base-table access to family data
begin;
set local role authenticated; select t.as_user(:'pengurus');
select t.ok((select count(*) from public.families) = 0, 'pengurus reads no family rows');
select t.ok((select count(*) from public.children) = 0, 'pengurus reads no children rows');
rollback;

-- ---- konselor has no family access either
begin;
set local role authenticated; select t.as_user(:'konselor');
select t.ok((select count(*) from public.families) = 0, 'konselor reads no family rows');
rollback;

-- ---- super_admin: manages roles, reads audit, role change is audited
begin;
set local role authenticated; select t.as_user(:'super');
insert into public.user_roles(profile_id, role) values (:'wijaya', 'hrd');
select t.ok((select count(*) from public.audit_log where row_table = 'user_roles' and action = 'INSERT') >= 1, 'role grant is written to the audit log');
select t.throws($$update public.audit_log set action = 'x'$$, 'audit log rows cannot be updated');
select t.throws($$delete from public.audit_log$$, 'audit log rows cannot be deleted');
select t.throws($$truncate public.audit_log$$, 'audit log cannot be truncated');
rollback;

-- ---- JWT claim sync
begin;
set local role service_role;
select t.ok((select raw_app_meta_data->'roles' from auth.users where id = :'wijaya') @> '["parent","ktb_member"]'::jsonb, 'roles are synced into the JWT claim source');
update public.user_roles set active = false where profile_id = :'wijaya' and role = 'ktb_member';
select t.ok(not ((select raw_app_meta_data->'roles' from auth.users where id = :'wijaya') ? 'ktb_member'), 'deactivating a role removes it from the claim');
rollback;

-- ---- anonymous visitors
begin;
set local role anon;
select t.throws($$select * from public.families$$, 'anon cannot read families');
select t.throws($$select * from public.children$$, 'anon cannot read children');
select t.throws($$select * from public.profiles$$, 'anon cannot read profiles');
select t.throws($$select * from public.contact_messages$$, 'anon cannot read contact messages');
select t.throws($$insert into public.contact_messages(name, contact, message) values ('Budi','budi@example.test','hello there')$$, 'anon cannot write contact messages directly');
rollback;

-- ---- service role paths used by the server
begin;
set local role service_role;
select t.ok((select user_id from public.find_family_login('6281200001111','2024-05-12')) in (:'santoso'::uuid, '00000000-0000-4000-8000-000000000002'::uuid), 'family login finds the family by number + child DOB');
select t.ok(not exists (select 1 from public.find_family_login('6281200001111','2000-01-01')), 'wrong DOB finds nothing');
select t.ok(not exists (select 1 from public.find_family_login('6281299999999','2024-05-12')), 'wrong number finds nothing');
select t.ok(not exists (select 1 from public.find_family_login('6281200002222','2024-05-12')), 'another family''s DOB does not cross over');
select t.ok(public.rate_limit_hit('k',2,60), 'rate limit hit 1 allowed');
select t.ok(public.rate_limit_hit('k',2,60), 'rate limit hit 2 allowed');
select t.ok(not public.rate_limit_hit('k',2,60), 'rate limit hit 3 blocked');
insert into public.contact_messages(name, contact, message) values ('Budi','budi@example.test','Halo, saya ingin bertanya.');
select t.throws($$insert into public.contact_messages(name, contact, message) values ('B','x','y')$$, 'contact message length checks hold');
rollback;

\echo ALL RLS TESTS PASSED
