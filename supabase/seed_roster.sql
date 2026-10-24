-- FAKE DATA ONLY. Demo roster shaped like the real SK student list (same class names, sizes per level, siblings sharing a family,
-- some families without a WhatsApp number, three past Saturdays of attendance) but every name and number is invented.
-- Run AFTER migrations and seed.sql, once. It needs the active semester and lessons 9 to 11 from seed.sql.
-- Everything it creates has pilot_ref 'demo:...', so it can be removed again with the cleanup at the bottom.
-- Phone numbers use the 62800 prefix, which is not a mobile range, so they cannot reach a real person.

begin;   -- one transaction: if anything fails, nothing is kept

do $$ begin
  if exists (select 1 from public.families where pilot_ref like 'demo:%') then raise exception 'demo roster is already loaded'; end if;
  if not exists (select 1 from public.semesters where active) then raise exception 'no active semester: run seed.sql first'; end if;
end $$;

create temp table _spec (sid int, cname text, n int, dob_from date, dob_to date);
insert into _spec values
  -- online
  (1,'Tomas (Online)',6,'2019-01-01','2024-06-30'),(2,'Simon (Online)',5,'2019-01-01','2024-06-30'),(3,'Musa (Online)',5,'2019-01-01','2024-06-30'),
  (4,'Titus (Online)',4,'2019-01-01','2024-06-30'),(5,'Yosua (Online)',3,'2019-01-01','2024-06-30'),(6,'Nuh (Online)',3,'2019-01-01','2024-06-30'),
  (7,'Samuel (Online)',3,'2019-01-01','2024-06-30'),(8,'Yehuda (Online)',3,'2019-01-01','2024-06-30'),(9,'Kaleb (Online)',3,'2019-01-01','2024-06-30'),
  (10,'Korintus (Online)',3,'2019-01-01','2024-06-30'),(11,'Daud (Online)',2,'2019-01-01','2024-06-30'),(12,'Abraham (Online)',2,'2019-01-01','2024-06-30'),
  (13,'Matius (Online)',2,'2019-01-01','2024-06-30'),(14,'Emaus (Online)',1,'2019-01-01','2024-06-30'),(15,'Yusuf (Online)',1,'2019-01-01','2024-06-30'),
  -- batita
  (20,'Gideon',11,'2021-07-01','2024-06-30'),(21,'Markus (Batita)',10,'2021-07-01','2024-06-30'),(22,'Efraim',14,'2021-07-01','2024-06-30'),
  -- TK
  (30,'Korintus',3,'2019-07-01','2021-12-31'),(31,'Matius',8,'2019-07-01','2021-12-31'),(32,'Samuel',9,'2019-07-01','2021-12-31'),
  (33,'Yehuda (TK)',13,'2019-07-01','2021-12-31'),(34,'Yusuf',10,'2019-07-01','2021-12-31'),
  -- kelas 1 to 6
  (41,'Musa',12,'2018-07-01','2019-12-31'),(42,'Yosua',9,'2018-07-01','2019-12-31'),(43,'Korintus',4,'2018-07-01','2019-12-31'),
  (51,'Galatia',5,'2017-07-01','2018-12-31'),(52,'Daud',12,'2017-07-01','2018-12-31'),(53,'Tomas',5,'2017-07-01','2018-12-31'),
  (61,'Galatia',4,'2016-07-01','2017-12-31'),(62,'Paulus',9,'2016-07-01','2017-12-31'),(63,'Daniel',12,'2016-07-01','2017-12-31'),
  (71,'Kaleb',17,'2015-07-01','2016-12-31'),(72,'Simon',10,'2015-07-01','2016-12-31'),
  (81,'Abraham',8,'2014-07-01','2015-12-31'),(82,'Nuh',9,'2014-07-01','2015-12-31'),(83,'Emaus',3,'2014-07-01','2015-12-31'),
  (91,'Petrus',19,'2013-07-01','2014-12-31'),(92,'Berea',3,'2013-07-01','2014-12-31');

create temp table _names (kind text, i int, v text);
insert into _names select 'g', row_number() over (), v from unnest(array[
  'Aaron','Abigail','Adrian','Alvin','Amanda','Andrea','Angel','Bryan','Calvin','Carissa','Caleb','Chloe','Daniel','David','Debora','Elisa',
  'Emmanuel','Esther','Evan','Felicia','Gabriel','Grace','Hana','Ivan','Jasmine','Joshua','Kevin','Keisha','Lydia','Marcus','Naomi','Nathan',
  'Olivia','Priscilla','Rafael','Rebecca','Samuel','Sarah','Timothy','Valerie']) v;
insert into _names select 's', row_number() over (), v from unnest(array[
  'Aditama','Bangun','Chandra','Darmawan','Efendi','Firmansyah','Gunadi','Hartono','Irawan','Jusuf','Kurnia','Lesmana','Mulia','Nugraha',
  'Oktavian','Pratama','Rahardja','Salim','Tanujaya','Utomo','Wibisono','Yuwono','Zulkarnain','Handoko','Kusuma','Lukito','Mandala','Natalegawa']) v;

-- one row per child; siblings (about 65 percent as many families as children) share a family inside their class
create temp table _kids as
select s.sid, s.cname, k, ceil(k * 0.65)::int as fk,
       (select v from _names where kind = 'g' and i = 1 + abs(hashtext('c1' || s.sid || ':' || k)) % 40) || ' ' ||
       (select v from _names where kind = 'g' and i = 1 + abs(hashtext('c2' || s.sid || ':' || k)) % 40) as given,
       s.dob_from + (abs(hashtext('d' || s.sid || ':' || k)) % (s.dob_to - s.dob_from + 1)) as dob
from _spec s, generate_series(1, s.n) k;

create temp table _fam as
select row_number() over (order by sid, fk) as rn, sid, cname, fk,
       md5('demo-family:' || sid || ':' || fk)::uuid as id,
       (select v from _names where kind = 's' and i = 1 + abs(hashtext('s' || sid || ':' || fk)) % 28) as surname,
       (select v from _names where kind = 'g' and i = 1 + abs(hashtext('p' || sid || ':' || fk)) % 40) as papa,
       (select v from _names where kind = 'g' and i = 1 + abs(hashtext('m' || sid || ':' || fk)) % 40) as mama,
       abs(hashtext('w' || sid || ':' || fk)) % 100 as roll
from (select distinct sid, cname, fk from _kids) f;

-- classes: capacity always covers the class so the capacity guard never blocks the insert
insert into public.sk_classes (semester_id, name, capacity)
select (select id from public.semesters where active), cname, greatest(14, ceil(sum(n) * 1.15)::int)
from _spec group by cname
on conflict (semester_id, name) do nothing;

insert into public.families (id, name, wa_number, member_code, data_status, pilot_ref)
select id, surname,
       case when roll >= 18 then '62800' || lpad(rn::text, 7, '0') end,          -- about 18 percent have no number on file, as in the real list
       'DEMO-' || lpad(rn::text, 4, '0'),
       case when roll < 18 or roll % 5 = 0 then 'cek' else 'ok' end,
       'demo:' || sid || ':' || fk
from _fam;

insert into public.family_members (family_id, relation, display_name)
select id, 'papa'::public.family_relation, papa || ' ' || surname from _fam where roll % 13 <> 0          -- a few single-parent families
union all
select id, 'mama'::public.family_relation, mama || ' ' || surname from _fam where roll % 17 <> 0;

insert into public.children (id, family_id, name, dob, pilot_ref)
select md5('demo-child:' || k.sid || ':' || k.k)::uuid, f.id, k.given || ' ' || f.surname, k.dob, 'demo:' || k.sid || ':' || k.k
from _kids k join _fam f on f.sid = k.sid and f.fk = k.fk;

-- the member audit trigger would add one "Menempatkan anak di kelas" line per child to the admin activity feed
alter table public.sk_class_members disable trigger class_members_audit;
insert into public.sk_class_members (class_id, family_id, child_id)
select c.id, f.id, md5('demo-child:' || k.sid || ':' || k.k)::uuid
from _kids k
join _fam f on f.sid = k.sid and f.fk = k.fk
join public.sk_classes c on c.name = k.cname and c.semester_id = (select id from public.semesters where active);
alter table public.sk_class_members enable trigger class_members_audit;

-- three past Saturdays with lessons 9 to 11, roughly 85 percent of families present
insert into public.sk_meetings (class_id, lesson_id, held_on, pilot_ref)
select c.id, l.id, d.held_on, 'demo:' || c.name || ':' || d.held_on
from (select distinct c.id, c.name from public.sk_classes c join _spec s on s.cname = c.name where c.semester_id = (select id from public.semesters where active)) c
cross join (values (date '2026-10-03', 9), (date '2026-10-10', 10), (date '2026-10-17', 11)) as d(held_on, lesson_no)
join public.lessons l on l.number = d.lesson_no
on conflict (class_id, held_on) do nothing;

insert into public.sk_attendance (meeting_id, kind, family_id, status, marked_at)
select mt.id, 'family', m.family_id,
       case when abs(hashtext(m.family_id::text || mt.held_on)) % 100 < 85 then 'in'::public.attendance_status else 'out'::public.attendance_status end,
       mt.held_on + time '11:00'
from public.sk_meetings mt
join (select distinct class_id, family_id from public.sk_class_members) m on m.class_id = mt.class_id
where mt.pilot_ref like 'demo:%'
on conflict do nothing;

drop table _spec, _names, _kids, _fam;

commit;

-- Cleanup, if you want the demo roster gone again (run as one statement block):
--   delete from public.sk_meetings where pilot_ref like 'demo:%';                 -- cascades to attendance
--   delete from public.families where pilot_ref like 'demo:%';                    -- cascades to members, children, class membership
--   delete from public.sk_classes c where not exists (select 1 from public.sk_class_members m where m.class_id = c.id)
--     and not exists (select 1 from public.sk_meetings x where x.class_id = c.id)
--     and c.name not in ('Elia','Markus','Yakub','Yehuda');
