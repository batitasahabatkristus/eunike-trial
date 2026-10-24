-- Phase 0 core: identity, roles, families, consent, notifications, audit, contact, rate limits.
-- PRD §7, §9. Every table has row-level security enabled; policies use has_role() / is_family_member().

-- pgcrypto lives in the `extensions` schema on Supabase (set_family_pin / verify_family_pin in 0002 put it on their search_path).
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

create type public.app_role as enum (
  'super_admin','pengurus','parent','prospect_parent','reference_giver','journal_reader','interviewer',
  'sk_guru','sk_kurikulum','sk_admin','sk_registration_admin','bendahara',
  'ktb_member','ktb_facilitator','ktb_speaker','ktb_admin','ktb_head',
  'event_participant','event_committee','event_admin',
  'staff','hrd','head_department','konseli','konselor','konseling_admin','markom',
  'volunteer','pendamping' -- OPEN Q-06: enum only, disabled in the UI
);
create type public.family_relation as enum ('papa','mama','wali','anak');

create function public.set_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;

-- ---------------------------------------------------------------- tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '' check (char_length(full_name) <= 120),
  email text,                         -- copied from auth.users by handle_new_user; staff never read auth.users directly
  phone text check (phone is null or char_length(phone) <= 32),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.app_role not null,
  scope_type text not null default 'global' check (scope_type in ('global','class','group','event','department')),
  scope_id uuid,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null    -- deleting an auth user must not be blocked by rows they created
);
create unique index user_roles_unique on public.user_roles
  (profile_id, role, scope_type, coalesce(scope_id, '00000000-0000-0000-0000-000000000000'::uuid));
create index user_roles_profile on public.user_roles(profile_id) where active;

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  wa_number text check (wa_number is null or wa_number ~ '^62[0-9]{8,15}$'),   -- normalised 62xxxxxxxx, used by family login
  privacy_timeline boolean not null default true,   -- CO-03: default on
  kbk_number text check (kbk_number is null or char_length(kbk_number) <= 40),   -- pilot gap; confirm with Eunike (PRD §13)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  deleted_at timestamptz
);
create unique index families_wa_unique on public.families(wa_number) where deleted_at is null and wa_number is not null;

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete set null,
  relation public.family_relation not null,
  display_name text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index family_members_family on public.family_members(family_id);
create index family_members_profile on public.family_members(profile_id) where profile_id is not null;

create table public.children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  dob date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index children_family on public.children(family_id);

create table public.consents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,                   -- 'privacy', 'counseling', 'whatsapp', ...
  version text not null,
  at timestamptz not null default now()
);
create index consents_profile on public.consents(profile_id, type);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  body text,
  action_url text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_profile on public.notifications(profile_id, created_at desc);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor uuid,
  role text,
  action text not null,
  row_table text,
  row_id text,
  before jsonb,
  after jsonb,
  ip text,
  at timestamptz not null default now()
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  contact text not null check (char_length(contact) between 5 and 160),
  message text not null check (char_length(message) between 5 and 4000),
  created_at timestamptz not null default now(),
  handled_at timestamptz
);

create table public.rate_limits (
  key text primary key,
  count integer not null,
  reset_at timestamptz not null
);

create trigger profiles_updated before update on public.profiles for each row execute function public.set_updated_at();
create trigger families_updated before update on public.families for each row execute function public.set_updated_at();
create trigger children_updated before update on public.children for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------- helpers
-- SECURITY DEFINER so policies on user_roles itself do not recurse. They read only the caller's own rows.
-- search_path is empty and every name is schema-qualified, so a temp table or a new schema can never shadow user_roles.
create function public.has_role(r public.app_role) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where profile_id = auth.uid() and role = r and active)
$$;

create function public.has_any_role(rs public.app_role[]) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles where profile_id = auth.uid() and role = any(rs) and active)
$$;

create function public.has_role_in(r public.app_role, st text, sid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.user_roles
    where profile_id = auth.uid() and role = r and active and scope_type = st and scope_id = sid)
$$;

create function public.is_family_member(fid uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.family_members
    where family_id = fid and profile_id = auth.uid() and deleted_at is null)
$$;

-- ------------------------------------------------- JWT claim sync (read by proxy.ts, advisory only)
-- Handles all three operations, and an UPDATE that moves a role between profiles refreshes both profiles.
create function public.sync_roles_to_jwt() returns trigger
language plpgsql security definer set search_path = '' as $$
declare pid uuid;
begin
  for pid in
    select distinct x from unnest(array[
      case when tg_op <> 'INSERT' then old.profile_id end,
      case when tg_op <> 'DELETE' then new.profile_id end]) x
    where x is not null
  loop
    update auth.users u set raw_app_meta_data = coalesce(u.raw_app_meta_data, '{}'::jsonb) || jsonb_build_object(
      'roles', coalesce((select jsonb_agg(distinct ur.role) from public.user_roles ur where ur.profile_id = pid and ur.active), '[]'::jsonb))
    where u.id = pid;
  end loop;
  return null;
end $$;
create trigger user_roles_sync after insert or delete or update of profile_id, role, active on public.user_roles
  for each row execute function public.sync_roles_to_jwt();

-- ------------------------------------------------- audit
create function public.audit_row() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.audit_log(actor, action, row_table, row_id, before, after)
  values (auth.uid(), tg_op, tg_table_name,
          coalesce((to_jsonb(new)->>'id'), (to_jsonb(old)->>'id')),
          case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
          case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end);
  return null;
end $$;
create trigger user_roles_audit after insert or update or delete on public.user_roles
  for each row execute function public.audit_row();
create trigger consents_audit after insert on public.consents
  for each row execute function public.audit_row();

create function public.audit_log_immutable() returns trigger language plpgsql set search_path = '' as $$
begin raise exception 'audit_log is append-only'; end $$;
create trigger audit_log_no_update before update or delete on public.audit_log
  for each row execute function public.audit_log_immutable();
create trigger audit_log_no_truncate before truncate on public.audit_log
  for each statement execute function public.audit_log_immutable();

-- A new auth user always gets a profile row.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email)
  on conflict do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keeps profiles.email in step when the user changes their email in Auth. (Deleting an auth user cascades to its profile.)
create function public.sync_user_email() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id and email is distinct from new.email;
  return null;
end $$;
create trigger on_auth_user_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function public.sync_user_email();

-- ------------------------------------------------- service-role-only functions
-- Sliding-window counter used by login and public forms. True = allowed.
create function public.rate_limit_hit(p_key text, p_max integer, p_window_seconds integer) returns boolean
language plpgsql security definer set search_path = '' as $$
declare n integer;
begin
  insert into public.rate_limits(key, count, reset_at)
  values (p_key, 1, now() + make_interval(secs => p_window_seconds))
  on conflict (key) do update set
    count = case when public.rate_limits.reset_at < now() then 1 else public.rate_limits.count + 1 end,
    reset_at = case when public.rate_limits.reset_at < now() then now() + make_interval(secs => p_window_seconds) else public.rate_limits.reset_at end
  returning count into n;
  return n <= p_max;
end $$;

-- Family login (PRD §7.1 / D6): the family that owns this WhatsApp number and has a child with this birth date.
create function public.find_family_login(p_phone text, p_dob date) returns table (user_id uuid, email text)
language sql stable security definer set search_path = '' as $$
  select u.id, u.email::text
  from public.families f
  join public.family_members fm on fm.family_id = f.id and fm.profile_id is not null and fm.deleted_at is null
  join auth.users u on u.id = fm.profile_id
  where f.wa_number = p_phone and f.deleted_at is null
    and exists (select 1 from public.children c where c.family_id = f.id and c.dob = p_dob and c.deleted_at is null)
    and exists (select 1 from public.user_roles ur where ur.profile_id = fm.profile_id and ur.role = 'parent' and ur.active)
  order by fm.created_at
  limit 1
$$;

-- ---------------------------------------------------------------- RLS (AC-02)
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.families enable row level security;
alter table public.family_members enable row level security;
alter table public.children enable row level security;
alter table public.consents enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.contact_messages enable row level security;
alter table public.rate_limits enable row level security;

-- Anonymous visitors touch nothing here directly; public forms go through server routes with the service role.
revoke all on all tables in schema public from anon;
-- Authenticated users get only the verbs their policies can use.
revoke all on all tables in schema public from authenticated;
-- UPDATE is granted per column: a client can never write id, email, deleted_at, timestamps or created_by, whatever the policy says.
-- (Triggers such as set_updated_at still change updated_at; column privileges only look at the columns named in the UPDATE.)
grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select on public.families to authenticated;
grant update (name, wa_number, kbk_number, privacy_timeline) on public.families to authenticated;   -- wa_number / kbk_number: staff only, see families_guard
grant select on public.family_members, public.children to authenticated;
grant select, insert on public.consents to authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.audit_log, public.contact_messages to authenticated;
-- rate_limits: no grants, no policies. Reachable only through rate_limit_hit().

-- Column rules RLS cannot express. Runs as the INVOKER on purpose: inside a SECURITY DEFINER function current_user is the owner,
-- so the server-side workflows (confirm_family_data, import, service role) pass through while a signed-in client does not.
-- A family may rename itself and set privacy_timeline; the WhatsApp number (the login key) and KBK number need SK staff.
create function public.families_guard() returns trigger language plpgsql set search_path = '' as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if (new.wa_number is distinct from old.wa_number or new.kbk_number is distinct from old.kbk_number)
     and not public.has_any_role(array['sk_admin','sk_registration_admin','super_admin']::public.app_role[]) then
    raise exception 'only SK staff can change the WhatsApp or KBK number' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger families_guard before update on public.families for each row execute function public.families_guard();

-- profiles
create policy profiles_self_read on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy profiles_admin_read on public.profiles for select to authenticated using (public.has_any_role(array['super_admin','sk_admin']::public.app_role[]));
create policy profiles_self_update on public.profiles for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

-- user_roles: people read their own; only super_admin changes roles (AD-03 adds sk_admin scoped changes later).
create policy roles_self_read on public.user_roles for select to authenticated using (profile_id = (select auth.uid()));
create policy roles_admin_read on public.user_roles for select to authenticated using (public.has_any_role(array['super_admin','sk_admin']::public.app_role[]));
create policy roles_super_write on public.user_roles for all to authenticated using (public.has_role('super_admin')) with check (public.has_role('super_admin'));

-- families (parent: own family only; sk_admin/super_admin: all). Never other families, even in the same class.
create policy families_member_read on public.families for select to authenticated using (public.is_family_member(id) and deleted_at is null);
create policy families_admin_read on public.families for select to authenticated using (public.has_any_role(array['super_admin','sk_admin']::public.app_role[]));
create policy families_member_update on public.families for update to authenticated using (public.is_family_member(id)) with check (public.is_family_member(id));
create policy members_member_read on public.family_members for select to authenticated using (public.is_family_member(family_id) and deleted_at is null);
create policy members_admin_read on public.family_members for select to authenticated using (public.has_any_role(array['super_admin','sk_admin']::public.app_role[]));
create policy children_member_read on public.children for select to authenticated using (public.is_family_member(family_id) and deleted_at is null);
create policy children_admin_read on public.children for select to authenticated using (public.has_any_role(array['super_admin','sk_admin']::public.app_role[]));

-- consents: own rows, insert only, never edited or removed
create policy consents_self_read on public.consents for select to authenticated using (profile_id = (select auth.uid()));
create policy consents_self_insert on public.consents for insert to authenticated with check (profile_id = (select auth.uid()));

-- notifications: own rows
create policy notifications_self_read on public.notifications for select to authenticated using (profile_id = (select auth.uid()));
create policy notifications_self_update on public.notifications for update to authenticated using (profile_id = (select auth.uid())) with check (profile_id = (select auth.uid()));

-- audit log: super_admin reads (PL-03); nobody writes except triggers and the service role
create policy audit_super_read on public.audit_log for select to authenticated using (public.has_role('super_admin'));

-- contact messages: markom and super_admin read
create policy contact_staff_read on public.contact_messages for select to authenticated using (public.has_any_role(array['markom','super_admin']::public.app_role[]));

-- ------------------------------------------------- function privileges (Supabase exposes `public` through its API)
-- New functions are executable by PUBLIC, and on Supabase also by anon and authenticated through default privileges, which would
-- make every SECURITY DEFINER function callable as an API endpoint. Start from nothing and grant only what is needed.
-- Trigger functions need no grant: EXECUTE is checked when the trigger is created, not when it fires.
-- Later migrations repeat this block for their own functions.
revoke execute on all functions in schema public from public, anon, authenticated;
grant execute on function public.has_role(public.app_role), public.has_any_role(public.app_role[]),
  public.has_role_in(public.app_role, text, uuid), public.is_family_member(uuid) to authenticated, service_role;   -- used inside RLS policies
grant execute on function public.rate_limit_hit(text, integer, integer), public.find_family_login(text, date) to service_role;
