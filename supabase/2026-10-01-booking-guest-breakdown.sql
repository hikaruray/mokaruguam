-- Mokaru Guam — keep the adults / children breakdown on the booking
-- Owner request, 2026-09-17.
--
-- 🔴 Run this ONCE in Supabase → SQL Editor, BEFORE the pivot-oct1 branch is
-- merged on 2026-09-30. addBooking() inserts an explicit column list, so
-- merging first would make every booking fail with 42703 — on the night the
-- new business opens.
--
-- Safe to run against the code that is live right now: three extra nullable
-- columns are ignored by the current insert, and existing rows keep working.
--
-- Why: the form has always asked for adults, children 4-11 and children 0-3,
-- but only the total was saved. The split survived only in the owner's
-- notification email. From October the booking request goes to a partner, and
-- a trial dive or a jet ski has an age limit — "4 guests" does not tell Gently
-- Blue whether one of them is three years old.

alter table public.bookings
  add column if not exists adults smallint check (adults >= 0),
  add column if not exists children_4to11 smallint check (children_4to11 >= 0),
  add column if not exists children_0to3 smallint check (children_0to3 >= 0);

-- Existing rows are left NULL rather than backfilled: "we never saved it" must
-- stay distinguishable from "no children".

comment on column public.bookings.adults is
  'Adults in the party. NULL = booking taken before 2026-10-01, when only the total (guests) was stored.';
comment on column public.bookings.children_4to11 is
  'Children aged 4-11. NULL = not recorded (pre-2026-10-01).';
comment on column public.bookings.children_0to3 is
  'Children aged 0-3. NULL = not recorded (pre-2026-10-01).';

-- Check afterwards — expect exactly three rows:
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public' and table_name = 'bookings'
--      and column_name in ('adults', 'children_4to11', 'children_0to3');
