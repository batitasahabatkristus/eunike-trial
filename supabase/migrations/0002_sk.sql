-- Phase 1: Sahabat Kristus parity (PRD §9.2 SK tables, §10.1 to §10.5). RLS on every table (AC-02).
-- Rules of thumb used below:
--  * parents: own family only; sharing/forum visible to the same class only
--  * sk_guru: only classes they are assigned to (user_roles scope_type = 'class')
--  * sk_admin: reads everything SK; writes through the same policies/functions as everyone else
--  * state changes that must be consistent go through SECURITY DEFINER functions that re-check the caller

-- ------------------------------------------------------------------ enums
create type public.lesson_status as enum ('draft','review','scheduled','published');
create type public.epk_status as enum ('draft','parent_sent','teacher_sent','ready','published');
create type public.attendance_kind as enum ('family','pendamping','pengurus');
create type public.attendance_status as enum ('in','out');

-- ------------------------------------------------------------------ core additions
alter table public.families add column data_status text not null default 'cek' check (data_status in ('ok','cor','cek'));
alter table public.families add column member_code text unique;
alter table public.children add column deleted_by uuid;
alter table public.children add column pilot_ref text;               -- SK Batita pilot traceability (PRD §13)
alter table public.profiles add column pilot_ref text;           -- import traceability (PRD §13)
alter table public.families add column pilot_ref text;
create unique index families_pilot_ref on public.families(pilot_ref) where pilot_ref is not null;
create unique index children_pilot_ref on public.children(pilot_ref) where pilot_ref is not null;

create table public.semesters (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  starts_on date not null,
  ends_on date not null,
  active boolean not null default false,
  created_at timestamptz not null default now()
);
create unique index semesters_one_active on public.semesters(active) where active;

create table public.sk_classes (
  id uuid primary key default gen_random_uuid(),
  semester_id uuid not null references public.semesters(id),
  name text not null,
  weekday text not null default 'Sabtu',
  start_time time not null default '09:00',
  capacity integer not null default 14 check (capacity > 0),
  created_at timestamptz not null default now(),
  unique (semester_id, name)
);

create table public.sk_class_members (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.sk_classes(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  status text not null default 'anggota_baru' check (status in ('anggota_baru','pindahan')),
  joined_at timestamptz not null default now(),
  unique (class_id, child_id)
);
create index sk_class_members_family on public.sk_class_members(family_id);

-- ------------------------------------------------------------------ lessons
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  number integer not null unique,
  title text not null,
  short_title text not null default '',
  truth text not null default '',
  goal text not null default '',                       -- "Tujuan belajar" on the SK home
  verse_text text not null default '',
  verse_ref text not null default '',
  thumbnail_path text,
  publish_at timestamptz,
  status public.lesson_status not null default 'draft',
  admin_note text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger lessons_updated before update on public.lessons for each row execute function public.set_updated_at();

create table public.lesson_steps (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null check (position between 1 and 24),
  title text not null,
  body text not null default '',
  kind text not null default 'text' check (kind in ('text','video','story','ayat','sharing','power','memory_marker')),
  story_scene integer check (story_scene between 1 and 5),   -- which scene a 'story' step shows
  video_url text,                                           -- Google Drive link at first (D4)
  unique (lesson_id, position)
);

create table public.lesson_scenes (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null check (position between 1 and 5),
  title text not null,
  image_path text,
  zoom numeric not null default 1,
  focus text not null default '50% 50%',
  narration_1_2 text not null default '',
  narration_2_3 text not null default '',
  narration_3_4 text not null default '',
  unique (lesson_id, position)
);

create table public.lesson_assets (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid references public.lessons(id) on delete set null,
  kind text not null check (kind in ('image','song','video','file')),
  title text not null,
  storage_path text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.power_items (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  position integer not null check (position between 1 and 3),
  text text not null,
  unique (lesson_id, position)
);

-- ------------------------------------------------------------------ family progress
create table public.lesson_progress (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  step integer not null default 0 check (step between 0 and 23),         -- 0-based current step
  done_steps integer not null default 0 check (done_steps between 0 and 24),
  updated_at timestamptz not null default now(),
  unique (family_id, lesson_id)
);
create table public.ayat_progress (
  family_id uuid not null references public.families(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  items boolean[] not null default '{f,f,f}' check (array_length(items, 1) = 3),
  memorized boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (family_id, lesson_id)
);
create table public.power_progress (
  family_id uuid not null references public.families(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  items boolean[] not null default '{f,f,f}' check (array_length(items, 1) = 3),
  updated_at timestamptz not null default now(),
  primary key (family_id, lesson_id)
);

-- ------------------------------------------------------------------ meetings and attendance (one table, PRD §9.2)
create table public.sk_meetings (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.sk_classes(id) on delete cascade,
  lesson_id uuid references public.lessons(id),
  held_on date not null,
  pilot_ref text,
  created_at timestamptz not null default now(),
  unique (class_id, held_on)
);
create unique index sk_meetings_pilot_ref on public.sk_meetings(pilot_ref) where pilot_ref is not null;
create table public.sk_attendance (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.sk_meetings(id) on delete cascade,
  kind public.attendance_kind not null default 'family',
  family_id uuid references public.families(id) on delete cascade,
  person_name text,                                   -- pendamping / pengurus rows
  status public.attendance_status,                    -- null = belum diisi
  family_report jsonb,                                -- what the family ticked itself (CO-02)
  reported_at timestamptz,
  marked_by uuid references public.profiles(id),
  marked_at timestamptz,
  check ((kind = 'family' and family_id is not null) or (kind <> 'family' and person_name is not null))
);
create unique index sk_attendance_unique on public.sk_attendance (meeting_id, kind, coalesce(family_id::text, person_name));

-- ------------------------------------------------------------------ community
create table public.sharing_posts (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.sk_classes(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  pinned boolean not null default false,
  pilot_ref text,
  created_at timestamptz not null default now()
);
create index sharing_posts_class_lesson on public.sharing_posts(class_id, lesson_id, created_at);
create table public.sharing_likes (
  post_id uuid not null references public.sharing_posts(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, family_id)                    -- one per family (SK-08)
);
create table public.forum_posts (                      -- guru replies
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.sk_classes(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  display_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

create table public.memory_markers (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  q1 text not null default '', q2 text not null default '', q3 text not null default '', q4 text not null default '',
  love_in_action text[] not null default '{}' check (love_in_action <@ array['Melayani','Memberi','Mengampuni']),
  faith_talk boolean not null default false,
  couch_time boolean not null default false,
  is_new boolean not null default true,               -- "Baru" for the teacher
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (family_id, lesson_id)                       -- isolated per lesson (SK-11)
);
create table public.memory_marker_files (
  id uuid primary key default gen_random_uuid(),
  marker_id uuid not null references public.memory_markers(id) on delete cascade,
  storage_path text not null,
  mime text not null,
  size_bytes bigint not null check (size_bytes between 1 and 52428800),   -- 50 MB
  created_at timestamptz not null default now()
);

create table public.data_corrections (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  body text not null check (char_length(body) between 3 and 2000),
  status text not null default 'open' check (status in ('open','resolved')),
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles(id),
  resolved_at timestamptz
);

-- ------------------------------------------------------------------ EPK
create table public.epk_reports (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  child_id uuid not null references public.children(id) on delete cascade,
  semester_id uuid not null references public.semesters(id),
  parent_5g jsonb,                                    -- {g, gl, gr, go, gd}
  teacher_5g jsonb,                                   -- {note}
  p4 jsonb,                                           -- {a, b, c, d} Pengamatan, Peneguhan, Percakapan, Pendampingan
  status public.epk_status not null default 'draft',
  parent_sent_at timestamptz,
  teacher_sent_at timestamptz,
  published_at timestamptz,
  published_by uuid references public.profiles(id),
  unique (child_id, semester_id)
);
create table public.family_pins (
  family_id uuid primary key references public.families(id) on delete cascade,
  pin_hash text not null,
  updated_at timestamptz not null default now()
);

-- Parenting library (CO-09). Writers (markom) arrive in Phase 3; reading is needed now.
create table public.content_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text not null default '',
  format text not null check (format in ('article','podcast','guide','instagram','tiktok')),
  status text not null default 'draft' check (status in ('draft','review','approved','published')),
  url text,
  due_date date,
  owner text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------------ helpers
create function public.is_class_guru(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where profile_id = auth.uid() and role = 'sk_guru'
                 and active and scope_type = 'class' and scope_id = cid)
$$;

-- caller has a child/family in this class
create function public.is_class_family(cid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sk_class_members m
                 join public.family_members fm on fm.family_id = m.family_id and fm.deleted_at is null
                 where m.class_id = cid and fm.profile_id = auth.uid())
$$;

create function public.family_class_id(fid uuid) returns uuid
language sql stable security definer set search_path = public as $$
  select m.class_id from public.sk_class_members m
  join public.sk_classes c on c.id = m.class_id
  join public.semesters s on s.id = c.semester_id and s.active
  where m.family_id = fid order by m.joined_at desc limit 1
$$;

-- caller teaches a class this family belongs to
create function public.is_guru_of_family(fid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.sk_class_members m
                 join public.user_roles ur on ur.scope_id = m.class_id and ur.profile_id = auth.uid()
                 where m.family_id = fid and ur.role = 'sk_guru' and ur.active and ur.scope_type = 'class')
$$;

create function public.is_sk_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select public.has_any_role(array['sk_admin','super_admin']::public.app_role[])
$$;

-- internal: write a notification. Not callable by clients.
create function public.notify(p_profile uuid, p_title text, p_body text, p_url text) returns void
language sql security definer set search_path = public as $$
  insert into public.notifications(profile_id, title, body, action_url) values (p_profile, p_title, p_body, p_url)
$$;
revoke all on function public.notify(uuid, text, text, text) from public, anon, authenticated;

create function public.family_profiles(fid uuid) returns setof uuid
language sql stable security definer set search_path = public as $$
  select profile_id from public.family_members where family_id = fid and profile_id is not null and deleted_at is null
$$;
revoke all on function public.family_profiles(uuid) from public, anon, authenticated;

-- ------------------------------------------------------------------ guard triggers (column-level rules RLS cannot express)
-- These guards run as the INVOKER on purpose: inside a SECURITY DEFINER function current_user would be the owner and the check would never fire.
-- families_guard now lives in 0001 (together with the column-level UPDATE grants on families and profiles).


-- Guru may only pin/hide posts; nothing else on a post can change after it is written.
create function public.sharing_posts_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if (to_jsonb(new) - 'hidden' - 'pinned') is distinct from (to_jsonb(old) - 'hidden' - 'pinned') then
    raise exception 'only hidden and pinned can change' using errcode = '42501';
  end if;
  return new;
end $$;
create trigger sharing_posts_guard before update on public.sharing_posts for each row execute function public.sharing_posts_guard();

-- Teacher marks "Baru" off; the family's own answers are never editable by the teacher.
create function public.memory_markers_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if public.is_guru_of_family(old.family_id) and not public.is_family_member(old.family_id) then
    if (to_jsonb(new) - 'is_new' - 'updated_at') is distinct from (to_jsonb(old) - 'is_new' - 'updated_at') then
      raise exception 'teachers can only mark a Memory Marker as read' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;
create trigger memory_markers_guard before update on public.memory_markers for each row execute function public.memory_markers_guard();
create trigger memory_markers_updated before update on public.memory_markers for each row execute function public.set_updated_at();

create function public.memory_marker_files_limit() returns trigger language plpgsql set search_path = public as $$
begin
  if (select count(*) from public.memory_marker_files where marker_id = new.marker_id) >= 3 then
    raise exception 'maximum 3 files per Memory Marker' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger memory_marker_files_limit before insert on public.memory_marker_files for each row execute function public.memory_marker_files_limit();

-- Lesson workflow (PRD §11.2): Kurikulum draft<->review; Admin review->scheduled|draft, scheduled->draft; only the system publishes.
create function public.lessons_status_guard() returns trigger language plpgsql set search_path = public as $$
declare ok boolean := false;
begin
  if current_user in ('postgres', 'service_role', 'supabase_admin') then return new; end if;
  if tg_op = 'INSERT' then
    if new.status <> 'draft' then raise exception 'new lessons start as draft' using errcode = '42501'; end if;
    return new;
  end if;
  if new.status = old.status then
    if old.status in ('scheduled','published') and (to_jsonb(new) - 'updated_at' - 'publish_at' - 'admin_note') is distinct from (to_jsonb(old) - 'updated_at' - 'publish_at' - 'admin_note') then
      raise exception 'scheduled or published lessons cannot be edited; cancel the schedule first' using errcode = '42501';
    end if;
    -- only admins move an approved date
    if old.status in ('scheduled','published') and new.publish_at is distinct from old.publish_at and not public.is_sk_staff() then
      raise exception 'only an admin can reschedule' using errcode = '42501';
    end if;
    return new;
  end if;
  if public.has_role('sk_kurikulum') then
    ok := (old.status = 'draft' and new.status = 'review') or (old.status = 'review' and new.status = 'draft');
  end if;
  if public.is_sk_staff() then
    ok := ok or (old.status = 'review' and new.status in ('scheduled','draft'))
             or (old.status = 'scheduled' and new.status = 'draft')
             or (old.status = 'draft' and new.status = 'scheduled');
  end if;
  if not ok or (new.status = 'scheduled' and new.publish_at is null) then
    raise exception 'status change % -> % not allowed', old.status, new.status using errcode = '42501';
  end if;
  return new;
end $$;
create trigger lessons_status_guard before insert or update on public.lessons for each row execute function public.lessons_status_guard();

-- capacity: a full class blocks new members (CO-05)
create function public.class_capacity_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(distinct family_id) from public.sk_class_members where class_id = new.class_id)
     >= (select capacity from public.sk_classes where id = new.class_id)
     and not exists (select 1 from public.sk_class_members where class_id = new.class_id and family_id = new.family_id) then
    raise exception 'class is full' using errcode = '23514';
  end if;
  return new;
end $$;
create trigger class_capacity_guard before insert on public.sk_class_members for each row execute function public.class_capacity_guard();

-- ------------------------------------------------------------------ functions called by the app (all re-check the caller)
create function public.confirm_family_data(fid uuid) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_family_member(fid) then raise exception 'not your family' using errcode = '42501'; end if;
  update public.families set data_status = 'ok' where id = fid;
end $$;

create function public.submit_family_correction(fid uuid, txt text) returns void language plpgsql security definer set search_path = public as $$
begin
  if not public.is_family_member(fid) then raise exception 'not your family' using errcode = '42501'; end if;
  insert into public.data_corrections(family_id, body) values (fid, txt);
  update public.families set data_status = 'cor' where id = fid;
end $$;

create function public.resolve_family_correction(fid uuid) returns void language plpgsql security definer set search_path = public as $$
declare p uuid;
begin
  if not public.is_sk_staff() then raise exception 'admin only' using errcode = '42501'; end if;
  update public.data_corrections set status = 'resolved', resolved_by = auth.uid(), resolved_at = now() where family_id = fid and status = 'open';
  update public.families set data_status = 'ok' where id = fid;
  for p in select public.family_profiles(fid) loop
    perform public.notify(p, 'Koreksi data keluarga sudah diselesaikan', null, '/sk/keluarga/data');
  end loop;
end $$;

create function public.register_child_to_class(p_child uuid, p_class uuid, p_status text) returns void
language plpgsql security definer set search_path = public as $$
declare fid uuid;
begin
  select family_id into fid from public.children where id = p_child and deleted_at is null;
  if fid is null or not public.is_family_member(fid) then raise exception 'not your child' using errcode = '42501'; end if;
  if p_status not in ('anggota_baru','pindahan') then raise exception 'bad status'; end if;
  -- one active class per child in the current semester
  delete from public.sk_class_members m using public.sk_classes c, public.semesters s
   where m.child_id = p_child and c.id = m.class_id and s.id = c.semester_id and s.active and m.class_id <> p_class;
  insert into public.sk_class_members(class_id, family_id, child_id, status) values (p_class, fid, p_child, p_status)
  on conflict (class_id, child_id) do update set status = excluded.status;
end $$;

-- Parent ticks who came (CO-02). Does not change the teacher's Masuk/Tidak.
create function public.report_family_attendance(p_meeting uuid, p_fid uuid, p_report jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_family_member(p_fid) then raise exception 'not your family' using errcode = '42501'; end if;
  if not exists (select 1 from public.sk_meetings mt join public.sk_class_members m on m.class_id = mt.class_id
                 where mt.id = p_meeting and m.family_id = p_fid) then raise exception 'not your class' using errcode = '42501'; end if;
  insert into public.sk_attendance(meeting_id, kind, family_id, family_report, reported_at)
  values (p_meeting, 'family', p_fid, p_report, now())
  on conflict (meeting_id, kind, coalesce(family_id::text, person_name))
  do update set family_report = excluded.family_report, reported_at = excluded.reported_at;
end $$;

create function public.ensure_meeting(p_class uuid, p_date date) returns uuid
language plpgsql security definer set search_path = public as $$
declare mid uuid; lid uuid;
begin
  if not (public.is_class_guru(p_class) or public.is_sk_staff()) then raise exception 'not allowed' using errcode = '42501'; end if;
  select id into lid from public.lessons where status = 'published' order by number desc limit 1;
  insert into public.sk_meetings(class_id, lesson_id, held_on) values (p_class, lid, p_date)
  on conflict (class_id, held_on) do nothing;
  select id into mid from public.sk_meetings where class_id = p_class and held_on = p_date;
  return mid;
end $$;

-- GU-02: one call saves every row atomically. p_rows = [{kind, family_id?, name?, status: 'in'|'out'|null}]
create function public.save_attendance(p_meeting uuid, p_rows jsonb) returns integer
language plpgsql security definer set search_path = public as $$
declare cid uuid; r jsonb; n integer := 0;
begin
  select class_id into cid from public.sk_meetings where id = p_meeting;
  if cid is null or not (public.is_class_guru(cid) or public.is_sk_staff()) then raise exception 'not allowed' using errcode = '42501'; end if;
  for r in select * from jsonb_array_elements(p_rows) loop
    insert into public.sk_attendance(meeting_id, kind, family_id, person_name, status, marked_by, marked_at)
    values (p_meeting, (r->>'kind')::public.attendance_kind, nullif(r->>'family_id','')::uuid, r->>'name',
            nullif(r->>'status','')::public.attendance_status, auth.uid(), now())
    on conflict (meeting_id, kind, coalesce(family_id::text, person_name))
    do update set status = excluded.status, marked_by = excluded.marked_by, marked_at = excluded.marked_at;
    n := n + 1;
  end loop;
  insert into public.audit_log(actor, action, row_table, row_id, after) values (auth.uid(), 'ATTENDANCE_SAVED', 'sk_meetings', p_meeting::text, jsonb_build_object('rows', n, 'class_id', cid));
  return n;
end $$;

create function public.submit_parent_epk(p_child uuid, p_sem uuid, p_5g jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare fid uuid; cur public.epk_status;
begin
  select family_id into fid from public.children where id = p_child;
  if fid is null or not public.is_family_member(fid) then raise exception 'not your child' using errcode = '42501'; end if;
  select status into cur from public.epk_reports where child_id = p_child and semester_id = p_sem;
  if cur = 'published' then raise exception 'report already published' using errcode = '42501'; end if;
  insert into public.epk_reports(family_id, child_id, semester_id, parent_5g, status, parent_sent_at)
  values (fid, p_child, p_sem, p_5g, 'parent_sent', now())
  on conflict (child_id, semester_id) do update set parent_5g = excluded.parent_5g, parent_sent_at = now(),
    status = case when public.epk_reports.teacher_sent_at is not null then 'ready'::public.epk_status else 'parent_sent'::public.epk_status end;
end $$;

create function public.submit_teacher_epk(p_child uuid, p_sem uuid, p_5g jsonb, p_p4 jsonb) returns void
language plpgsql security definer set search_path = public as $$
declare fid uuid; cur public.epk_status;
begin
  select family_id into fid from public.children where id = p_child;
  if fid is null or not public.is_guru_of_family(fid) then raise exception 'not your class' using errcode = '42501'; end if;
  select status into cur from public.epk_reports where child_id = p_child and semester_id = p_sem;
  if cur = 'published' then raise exception 'report already published' using errcode = '42501'; end if;
  insert into public.epk_reports(family_id, child_id, semester_id, teacher_5g, p4, status, teacher_sent_at)
  values (fid, p_child, p_sem, p_5g, p_p4, 'teacher_sent', now())
  on conflict (child_id, semester_id) do update set teacher_5g = excluded.teacher_5g, p4 = excluded.p4, teacher_sent_at = now(),
    status = case when public.epk_reports.parent_sent_at is not null then 'ready'::public.epk_status else 'teacher_sent'::public.epk_status end;
end $$;

create function public.publish_epk(p_report uuid) returns void
language plpgsql security definer set search_path = public as $$
declare r public.epk_reports; p uuid; nm text;
begin
  if not public.is_sk_staff() then raise exception 'admin only' using errcode = '42501'; end if;
  select * into r from public.epk_reports where id = p_report;
  if r.id is null or r.parent_sent_at is null or r.teacher_sent_at is null then
    raise exception 'both parent and teacher reflections are required' using errcode = '23514';
  end if;
  update public.epk_reports set status = 'published', published_at = now(), published_by = auth.uid() where id = p_report;
  select name into nm from public.children where id = r.child_id;
  for p in select public.family_profiles(r.family_id) loop
    perform public.notify(p, 'Laporan semester ' || nm || ' sudah terbit', null, '/beranda/laporan');
  end loop;
end $$;

-- PIN protects the published report (SK-12). Hashing (bcrypt) and checking both happen here so the app never handles hashes.
create function public.set_family_pin(fid uuid, pin text) returns void
language plpgsql security definer set search_path = public, extensions as $$
begin
  if not public.is_family_member(fid) then raise exception 'not your family' using errcode = '42501'; end if;
  if pin !~ '^[0-9]{4}$' then raise exception 'PIN must be four digits' using errcode = '22023'; end if;
  insert into public.family_pins(family_id, pin_hash) values (fid, crypt(pin, gen_salt('bf')))
  on conflict (family_id) do update set pin_hash = excluded.pin_hash, updated_at = now();
end $$;
create function public.has_family_pin(fid uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.family_pins where family_id = fid) and public.is_family_member(fid)
$$;
create function public.verify_family_pin(fid uuid, pin text) returns boolean
language sql stable security definer set search_path = public, extensions as $$
  select coalesce((select pin_hash = crypt(pin, pin_hash) from public.family_pins where family_id = fid), false) and public.is_family_member(fid)
$$;

-- EPK as the family may see it: teacher notes stay hidden until published.
create view public.v_epk_family with (security_barrier = true) as
  select id, family_id, child_id, semester_id, status, parent_5g,
         case when status = 'published' then teacher_5g end as teacher_5g,
         case when status = 'published' then p4 end as p4,
         published_at
  from public.epk_reports where public.is_family_member(family_id);

-- Moderation by the class teacher (GU-04) is a plain UPDATE guarded above. Likes and posts are plain INSERTs.

-- Publishing job (KU-03). Called by the cron route with the service role; never by clients.
create function public.publish_due_lessons() returns integer language plpgsql security definer set search_path = public as $$
declare l record; n integer := 0; p uuid;
begin
  for l in select * from public.lessons where status = 'scheduled' and publish_at <= now() order by number loop
    update public.lessons set status = 'published' where id = l.id;
    for p in select distinct fm.profile_id from public.family_members fm
             join public.user_roles ur on ur.profile_id = fm.profile_id and ur.role = 'parent' and ur.active
             where fm.profile_id is not null and fm.deleted_at is null loop
      perform public.notify(p, 'Pelajaran ' || l.number || ' sudah terbit', l.title, '/sk/keluarga');
    end loop;
    n := n + 1;
  end loop;
  return n;
end $$;
revoke all on function public.publish_due_lessons() from public, anon, authenticated;
grant execute on function public.publish_due_lessons() to service_role;

-- New Memory Marker -> notify the class teachers
create function public.memory_marker_notify() returns trigger language plpgsql security definer set search_path = public as $$
declare cid uuid; g uuid; fam text; ln integer;
begin
  cid := public.family_class_id(new.family_id);
  select name into fam from public.families where id = new.family_id;
  select number into ln from public.lessons where id = new.lesson_id;
  for g in select profile_id from public.user_roles where role = 'sk_guru' and active and scope_type = 'class' and scope_id = cid loop
    perform public.notify(g, 'Memory Marker baru dari Keluarga ' || fam, 'Pelajaran ' || ln, '/sk/guru/memory-marker');
  end loop;
  return null;
end $$;
create trigger memory_marker_notify after insert on public.memory_markers for each row execute function public.memory_marker_notify();

-- ------------------------------------------------------------------ audit on sensitive SK tables
create trigger lessons_audit after insert or update or delete on public.lessons for each row execute function public.audit_row();
create trigger epk_audit after insert or update on public.epk_reports for each row execute function public.audit_row();
create trigger families_audit after update on public.families for each row execute function public.audit_row();
create trigger class_members_audit after insert or update or delete on public.sk_class_members for each row execute function public.audit_row();

-- ------------------------------------------------------------------ RLS
do $$ declare t text; begin
  foreach t in array array['semesters','sk_classes','sk_class_members','lessons','lesson_steps','lesson_scenes','lesson_assets','power_items',
    'lesson_progress','ayat_progress','power_progress','sk_meetings','sk_attendance','sharing_posts','sharing_likes','forum_posts',
    'memory_markers','memory_marker_files','data_corrections','epk_reports','family_pins','content_items'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('revoke all on public.%I from authenticated', t);
  end loop;
end $$;

grant select on public.semesters, public.sk_classes, public.sk_class_members, public.lessons, public.lesson_steps, public.lesson_scenes,
  public.lesson_assets, public.power_items, public.sk_meetings, public.sk_attendance, public.sharing_likes, public.forum_posts,
  public.memory_marker_files, public.data_corrections, public.content_items to authenticated;
grant select, insert, update on public.lesson_progress, public.ayat_progress, public.power_progress to authenticated;
grant select, insert, update on public.lessons, public.lesson_steps, public.lesson_scenes, public.power_items to authenticated;
grant delete on public.lesson_steps, public.lesson_scenes, public.power_items to authenticated;
grant insert, update, delete on public.lesson_assets to authenticated;
grant select, insert, update on public.sharing_posts to authenticated;
grant insert on public.sharing_likes, public.forum_posts, public.memory_marker_files to authenticated;
grant select, insert, update on public.memory_markers to authenticated;
grant select, insert, update, delete on public.sk_classes to authenticated;
grant insert, update, delete on public.sk_class_members to authenticated;
grant select on public.epk_reports to authenticated;
grant select on public.v_epk_family to authenticated;
grant insert, update, delete on public.content_items to authenticated;
-- UPDATE on families stays column-level (0001); data_status etc. change only inside the definer functions below.
grant select, insert on public.families to authenticated;
grant select, insert on public.children to authenticated;
grant update (name, dob) on public.children to authenticated;   -- family_id, deleted_at, pilot_ref: server-side only
grant insert on public.family_members to authenticated;
-- family_pins: only through functions

-- semesters / classes: everyone signed in reads (names only), SK staff manage
create policy semesters_read on public.semesters for select using (auth.uid() is not null);
create policy classes_read on public.sk_classes for select using (auth.uid() is not null);
create policy classes_admin on public.sk_classes for all using (public.is_sk_staff()) with check (public.is_sk_staff());

-- class members
create policy members_family_read on public.sk_class_members for select using (public.is_family_member(family_id));
create policy members_guru_read on public.sk_class_members for select using (public.is_class_guru(class_id));
create policy members_admin_all on public.sk_class_members for all using (public.is_sk_staff()) with check (public.is_sk_staff());

-- teachers read families/children/adult members of their class
create policy families_guru_read on public.families for select using (public.is_guru_of_family(id));
create policy children_guru_read on public.children for select using (public.is_guru_of_family(family_id));
create policy members_guru_family_read on public.family_members for select using (public.is_guru_of_family(family_id));
-- admins (sk_admin, registration) create and edit families (AD-04)
create policy families_admin_write on public.families for insert with check (public.has_any_role(array['sk_admin','sk_registration_admin','super_admin']::public.app_role[]));
create policy families_admin_update on public.families for update using (public.has_any_role(array['sk_admin','sk_registration_admin','super_admin']::public.app_role[]));
create policy children_admin_write on public.children for insert with check (public.is_sk_staff());
create policy children_admin_update on public.children for update using (public.is_sk_staff());
create policy members_admin_insert on public.family_members for insert with check (public.is_sk_staff());

-- lessons: parents and teachers see published ones only; Kurikulum and admin see everything
create policy lessons_published_read on public.lessons for select using (status = 'published' and auth.uid() is not null);
create policy lessons_staff_read on public.lessons for select using (public.has_any_role(array['sk_kurikulum','sk_admin','super_admin']::public.app_role[]));
create policy lessons_kurikulum_write on public.lessons for insert with check (public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[]));
create policy lessons_kurikulum_update on public.lessons for update using (public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[]));

do $$ declare t text; begin
  foreach t in array array['lesson_steps','lesson_scenes','power_items'] loop
    execute format($f$create policy %1$s_published_read on public.%1$s for select
      using (exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'published'))$f$, t);
    execute format($f$create policy %1$s_staff_read on public.%1$s for select
      using (public.has_any_role(array['sk_kurikulum','sk_admin','super_admin']::public.app_role[]))$f$, t);
    -- content is editable only while the lesson is a draft
    execute format($f$create policy %1$s_staff_write on public.%1$s for all
      using (public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[])
             and exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'draft'))
      with check (public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[])
             and exists (select 1 from public.lessons l where l.id = lesson_id and l.status = 'draft'))$f$, t);
  end loop;
end $$;
create policy assets_read on public.lesson_assets for select using (public.has_any_role(array['sk_kurikulum','sk_admin','super_admin']::public.app_role[]));
create policy assets_write on public.lesson_assets for all using (public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[]))
  with check (public.has_any_role(array['sk_kurikulum','sk_admin']::public.app_role[]));

-- progress: own family
create policy lp_family on public.lesson_progress for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy ap_family on public.ayat_progress for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy pp_family on public.power_progress for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
grant select on public.lesson_progress, public.ayat_progress, public.power_progress to authenticated;
create policy lp_admin on public.lesson_progress for select using (public.is_sk_staff());

-- meetings and attendance
create policy meetings_family_read on public.sk_meetings for select using (public.is_class_family(class_id));
create policy meetings_guru_read on public.sk_meetings for select using (public.is_class_guru(class_id));
create policy meetings_admin_read on public.sk_meetings for select using (public.is_sk_staff());
create policy att_family_read on public.sk_attendance for select using (kind = 'family' and public.is_family_member(family_id));
create policy att_guru_read on public.sk_attendance for select using (exists (select 1 from public.sk_meetings m where m.id = meeting_id and public.is_class_guru(m.class_id)));
create policy att_admin_read on public.sk_attendance for select using (public.is_sk_staff());

-- sharing + forum: same class only; hidden posts vanish for parents
create policy sp_family_read on public.sharing_posts for select using (not hidden and public.is_class_family(class_id));
create policy sp_guru_read on public.sharing_posts for select using (public.is_class_guru(class_id));
create policy sp_admin_read on public.sharing_posts for select using (public.is_sk_staff());
create policy sp_family_insert on public.sharing_posts for insert
  with check (public.is_family_member(family_id) and public.is_class_family(class_id) and class_id = public.family_class_id(family_id));
create policy sp_guru_moderate on public.sharing_posts for update using (public.is_class_guru(class_id)) with check (public.is_class_guru(class_id));
create policy sl_read on public.sharing_likes for select using (exists (select 1 from public.sharing_posts p where p.id = post_id and (public.is_class_family(p.class_id) or public.is_class_guru(p.class_id))));
create policy sl_insert on public.sharing_likes for insert with check (public.is_family_member(family_id)
  and exists (select 1 from public.sharing_posts p where p.id = post_id and not p.hidden and public.is_class_family(p.class_id)));
create policy fp_read on public.forum_posts for select using (public.is_class_family(class_id) or public.is_class_guru(class_id) or public.is_sk_staff());
create policy fp_guru_insert on public.forum_posts for insert with check (author_id = auth.uid() and public.is_class_guru(class_id));

-- memory markers
create policy mm_family on public.memory_markers for all using (public.is_family_member(family_id)) with check (public.is_family_member(family_id));
create policy mm_guru_read on public.memory_markers for select using (public.is_guru_of_family(family_id));
create policy mm_guru_update on public.memory_markers for update using (public.is_guru_of_family(family_id)) with check (public.is_guru_of_family(family_id));
create policy mm_admin_read on public.memory_markers for select using (public.is_sk_staff());
create policy mmf_read on public.memory_marker_files for select using (exists (select 1 from public.memory_markers m where m.id = marker_id
  and (public.is_family_member(m.family_id) or public.is_guru_of_family(m.family_id) or public.is_sk_staff())));
create policy mmf_insert on public.memory_marker_files for insert with check (exists (select 1 from public.memory_markers m where m.id = marker_id and public.is_family_member(m.family_id)));

-- corrections
create policy dc_family_read on public.data_corrections for select using (public.is_family_member(family_id));
create policy dc_admin_read on public.data_corrections for select using (public.is_sk_staff());

-- EPK: teachers (own class) and admins read the base table; families use v_epk_family
create policy epk_guru_read on public.epk_reports for select using (public.is_guru_of_family(family_id));
create policy epk_admin_read on public.epk_reports for select using (public.is_sk_staff());

-- parenting library: published items for everyone signed in
create policy ci_read on public.content_items for select using (status = 'published' and auth.uid() is not null);
create policy ci_staff_read on public.content_items for select using (public.has_any_role(array['markom','super_admin','pengurus']::public.app_role[]));
create policy ci_markom_write on public.content_items for all using (public.has_any_role(array['markom','super_admin']::public.app_role[]))
  with check (public.has_any_role(array['markom','super_admin']::public.app_role[]));

-- admins may change SK roles (AD-03). Never grant super_admin or counseling roles, never touch their own last admin role.
drop policy if exists roles_super_write on public.user_roles;
create policy roles_super_write on public.user_roles for all using (public.has_role('super_admin')) with check (public.has_role('super_admin'));
create policy roles_sk_admin_write on public.user_roles for all
  using (public.has_role('sk_admin') and role in ('parent','sk_guru','sk_kurikulum','sk_admin'))
  with check (public.has_role('sk_admin') and role in ('parent','sk_guru','sk_kurikulum','sk_admin'));
create function public.user_roles_last_admin_guard() returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op in ('DELETE','UPDATE') and old.role = 'sk_admin' and old.profile_id = auth.uid()
     and (tg_op = 'DELETE' or new.active is false or new.role <> 'sk_admin')
     and not exists (select 1 from public.user_roles where role = 'sk_admin' and active and id <> old.id) then
    raise exception 'cannot remove the last sk_admin' using errcode = '23514';
  end if;
  if tg_op in ('DELETE','UPDATE') and old.role = 'sk_admin' and old.profile_id = auth.uid() and current_user not in ('postgres','service_role') then
    raise exception 'you cannot remove your own admin role' using errcode = '42501';
  end if;
  return coalesce(new, old);
end $$;
create trigger user_roles_last_admin before update or delete on public.user_roles for each row execute function public.user_roles_last_admin_guard();
-- SK admins also need to see who holds roles and names for the account screen
create policy profiles_sk_admin_read on public.profiles for select using (public.has_role('sk_admin'));
create policy profiles_sk_admin_update on public.profiles for update using (public.has_role('sk_admin'));

-- "Beri masukan" on the SK home (SK-01)
create table public.sk_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 3 and 2000),
  created_at timestamptz not null default now()
);
alter table public.sk_feedback enable row level security;
revoke all on public.sk_feedback from anon, authenticated;
grant select, insert on public.sk_feedback to authenticated;
create policy fb_insert on public.sk_feedback for insert with check (profile_id = auth.uid());
create policy fb_self_read on public.sk_feedback for select using (profile_id = auth.uid());
create policy fb_admin_read on public.sk_feedback for select using (public.is_sk_staff());

-- Class feed (SK-08, GU-04): posts and teacher replies for one class and lesson, with the family DISPLAY NAME only.
-- Parents cannot read other families' rows, so this definer function is the single way names reach the feed.
create function public.class_feed(p_class uuid, p_lesson uuid)
returns table (id uuid, kind text, family_id uuid, author text, body text, pinned boolean, hidden boolean, created_at timestamptz, likes integer, liked boolean)
language plpgsql stable security definer set search_path = public as $$
declare guru boolean := public.is_class_guru(p_class) or public.is_sk_staff();
begin
  if not (guru or public.is_class_family(p_class)) then raise exception 'not your class' using errcode = '42501'; end if;
  return query
    select p.id, 'post'::text, p.family_id, 'Keluarga ' || f.name, p.body, p.pinned, p.hidden, p.created_at,
           (select count(*)::integer from public.sharing_likes l where l.post_id = p.id),
           exists (select 1 from public.sharing_likes l join public.family_members fm on fm.family_id = l.family_id
                    where l.post_id = p.id and fm.profile_id = auth.uid() and fm.deleted_at is null)
      from public.sharing_posts p join public.families f on f.id = p.family_id
     where p.class_id = p_class and p.lesson_id = p_lesson and (guru or not p.hidden)
    union all
    select r.id, 'reply'::text, null::uuid, r.display_name, r.body, false, false, r.created_at, 0, false
      from public.forum_posts r where r.class_id = p_class and r.lesson_id = p_lesson
    order by 6 desc, 8;
end $$;

-- AD-06: the admin's two answers to a lesson in review, with a notification back to Kurikulum.
create function public.approve_lesson(p_id uuid) returns void language plpgsql security definer set search_path = public as $$
declare l public.lessons; k uuid;
begin
  if not public.is_sk_staff() then raise exception 'admin only' using errcode = '42501'; end if;
  select * into l from public.lessons where id = p_id;
  if l.id is null or l.status not in ('review','draft') then raise exception 'lesson is not awaiting approval' using errcode = '23514'; end if;
  if l.publish_at is null then raise exception 'publish date required' using errcode = '23514'; end if;
  update public.lessons set status = 'scheduled', admin_note = null where id = p_id;
  for k in select profile_id from public.user_roles where role = 'sk_kurikulum' and active loop
    perform public.notify(k, 'Materi disetujui: Pelajaran ' || l.number, l.title, '/sk/kurikulum/materi/' || p_id);
  end loop;
end $$;

create function public.request_lesson_revision(p_id uuid, p_note text) returns void language plpgsql security definer set search_path = public as $$
declare l public.lessons; k uuid;
begin
  if not public.is_sk_staff() then raise exception 'admin only' using errcode = '42501'; end if;
  if coalesce(trim(p_note), '') = '' then raise exception 'a note is required' using errcode = '22023'; end if;
  select * into l from public.lessons where id = p_id;
  if l.id is null or l.status not in ('review','scheduled') then raise exception 'lesson is not awaiting review' using errcode = '23514'; end if;
  update public.lessons set status = 'draft', admin_note = p_note where id = p_id;
  for k in select profile_id from public.user_roles where role = 'sk_kurikulum' and active loop
    perform public.notify(k, 'Revisi diminta: Pelajaran ' || l.number, p_note, '/sk/kurikulum/materi/' || p_id);
  end loop;
end $$;

-- ------------------------------------------------------------------ function privileges
-- Default is EXECUTE for everyone. Make it explicit: anon can call nothing; signed-in users can call app functions
-- (RLS policies need EXECUTE on the helpers); server-only functions stay with service_role.
-- Every later migration that adds functions repeats the last four statements.
revoke execute on all functions in schema public from public, anon;
grant execute on all functions in schema public to authenticated, service_role;
revoke execute on function public.notify(uuid, text, text, text), public.family_profiles(uuid),
  public.publish_due_lessons(), public.rate_limit_hit(text, integer, integer), public.find_family_login(text, date),
  public.sync_roles_to_jwt(), public.audit_row(), public.handle_new_user(), public.sync_user_email(),
  public.class_capacity_guard(), public.memory_marker_notify() from authenticated;

-- Parents cannot read other families' class rows, so the registration screen asks for the headcount through this function.
create function public.class_load(cid uuid) returns integer language sql stable security definer set search_path = public as $$
  select count(distinct family_id)::integer from public.sk_class_members where class_id = cid
$$;
grant execute on function public.class_load(uuid) to authenticated, service_role;
revoke execute on function public.class_load(uuid) from public, anon;

-- AD-01 recent activity: an SK admin may read the audit trail of SK tables only (never consents, counseling, finance).
create policy audit_sk_admin_read on public.audit_log for select
  using (public.has_role('sk_admin') and row_table in ('lessons','epk_reports','families','sk_class_members','sk_meetings','user_roles'));
