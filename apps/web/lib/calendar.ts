import "server-only";
import { isYmd, todayJakarta } from "@/lib/dates";
import type { Q } from "@/lib/db";
import type { CalLesson } from "@/components/app/PublishCalendar";

export const monthOf = (m: string | undefined) => (m && /^\d{4}-\d{2}$/.test(m) ? m : todayJakarta().slice(0, 7));
export const dayOf = (d: string | undefined) => (isYmd(d) ? d : null);
export const calendarLessons = (q: Q) =>
  q<CalLesson>("select id, number, title, status::text, publish_at::text, (publish_at at time zone 'Asia/Jakarta')::date::text as day, thumbnail_path from public.lessons where publish_at is not null order by number");
