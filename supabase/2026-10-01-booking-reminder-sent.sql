-- Mokaru Guam — remember that the day-before reminder went out
-- Owner request, 2026-09-17 (reducing no-shows on dives and jet skis).
--
-- 🔴 Run this ONCE in Supabase → SQL Editor, BEFORE the pivot-oct1 branch is
-- merged on 2026-09-30. The reminder job reads and writes this column; merging
-- first makes the job fail every day (bookings themselves are unaffected —
-- addBooking does not write it).
--
-- Safe to run against the code that is live right now: an extra nullable
-- column is ignored by the current insert, and existing rows keep working.
--
-- Why a column: /api/cron/reminders must send each guest ONE reminder. The
-- job claims a row by setting this from NULL to now() in a single UPDATE, so a
-- second run — Vercel retrying, or anyone loading the URL — finds nothing left
-- to claim and sends nothing.

alter table public.bookings
  add column if not exists reminder_sent_at timestamptz;

comment on column public.bookings.reminder_sent_at is
  'When the day-before reminder was claimed for sending. NULL = not sent. Set once; never cleared.';

-- Check afterwards — expect one row, timestamp with time zone, nullable:
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'bookings'
--      and column_name = 'reminder_sent_at';
