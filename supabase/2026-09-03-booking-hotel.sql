-- Mokaru Guam — collect the guest's hotel on the booking form
-- Owner request, 2026-09-03.
--
-- Run this ONCE in Supabase → SQL Editor, BEFORE deploying the code that
-- writes to it. addBooking() inserts an explicit column list, so shipping the
-- code first would make every booking fail — on the one site that actually
-- takes money.
--
-- Safe to run against the code that is live right now: an extra nullable
-- column is ignored by the current insert, and existing rows keep working.
--
-- Why a column rather than appending to notes: the hotel is where the guide
-- drives to. It belongs next to the date and the headcount in the admin list
-- and in the emails, not buried in free text the owner has to read through.

alter table public.bookings
  add column if not exists hotel text;

-- Existing bookings predate the field. Left null rather than backfilled with a
-- placeholder, so "we never asked" stays distinguishable from "they answered".

-- Check afterwards:
--   select id, name, preferred_date, hotel, created_at
--     from public.bookings order by created_at desc limit 20;

comment on column public.bookings.hotel is
  'Guest''s hotel / where the guide picks them up. NULL = booking taken before this column existed (2026-09-03).';
