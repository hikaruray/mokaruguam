-- Mokaru Guam — the Oct 1 pivot: one booking table, two kinds of request
-- Design: MokaruGuam/pivot-oct1-design.md §5 (v2, 2026-09-11)
--
-- WHAT CHANGES
-- The guided charter ends 2026-09-30. From 10/1 the same pipeline carries two
-- kinds of request instead of one:
--   tour       — we arrange a partner's activity. The guest pays us nothing;
--                the partner pays a 20% commission. No PayPal on this path.
--   restaurant — we book a table. $10, authorised at request time, captured
--                only when the table is actually held, voided otherwise.
--
-- 🔴 RUN THIS ONCE IN SUPABASE → SQL EDITOR, BEFORE THE CODE IS DEPLOYED.
-- addBooking() in src/lib/store.ts inserts an EXPLICIT column list. Shipping
-- the code against a table without these columns makes every booking fail — on
-- the one site that takes money. This is the order established on 2026-09-03
-- when the `hotel` column was added:
--   1. owner runs this SQL
--   2. the columns are verified to exist (see the check at the bottom)
--   3. only then is the code deployed
--
-- 🔴 BEFORE RUNNING: confirm the project ref is zqzbilvintyzgkliovvn and that
-- the SQL editor is pointed at Mokaru. This Supabase project is SHARED WITH
-- DaDeal. Look at the ref in the URL; do not trust the browser tab.
--
-- Safe against the code running right now: every column added here is nullable
-- (or defaulted), and the current insert does not mention any of them.

-- ---------------------------------------------------------------------------
-- 1. Which kind of request this is
-- ---------------------------------------------------------------------------
-- NULL on every existing row, on purpose. Those are charter bookings taken
-- before the question existed, and the code reads `request_type ?? "tour"` so
-- their cancellation and refund behaviour does not change by one cent. Same
-- principle as the `hotel` column: "we never asked" must stay distinguishable
-- from "they answered".
alter table public.bookings
  add column if not exists request_type text;

-- The partner company (tour) or the restaurant (first choice). One column
-- rather than two, because a row is only ever one kind of request.
alter table public.bookings
  add column if not exists partner_name text;

-- ---------------------------------------------------------------------------
-- 2. Restaurant-only fields
-- ---------------------------------------------------------------------------
-- What to do when the first-choice restaurant is full. Asked on the form and
-- REQUIRED there, because the alternative is emailing the guest mid-arrangement
-- and waiting — which is exactly the delay that outlives a PayPal hold.
--   cancel  — stop here, charge nothing
--   suggest — propose somewhere else (one proposal, per the terms)
alter table public.bookings
  add column if not exists fallback_choice text;

-- Optional hints used only to make that one proposal a good one.
alter table public.bookings
  add column if not exists budget_hint text;

alter table public.bookings
  add column if not exists cuisine_hint text;

-- ---------------------------------------------------------------------------
-- 3. Reference number
-- ---------------------------------------------------------------------------
-- Printed in the subject line of every email we send a partner or a restaurant
-- ("[Mokaru] 予約依頼 / Joe's Jet Ski / 2026-10-15 / 山田 / #0012"), so that at
-- month end the partner can search their own inbox for [Mokaru] and we can
-- point at one booking at a time when reconciling the 20%.
--
-- Numbered by the DATABASE, not the application. Counting rows in application
-- code to derive "the next number" gives two simultaneous requests the same
-- one, and a duplicated reference number is worse than no reference number:
-- it silently merges two bookings during reconciliation.
--
-- `always`, not `by default`. With `by default` an explicitly written value
-- does NOT advance the sequence, so a single hand-restored row eventually
-- collides with an auto-assigned one and the unique constraint rejects a real
-- booking — defeating the one property this column exists for. A hand restore
-- is still possible, it just has to say so:
--   insert into public.bookings (ref_no, ...) overriding system value values (...)
-- and then move the sequence past it.
alter table public.bookings
  add column if not exists ref_no integer generated always as identity;

-- ---------------------------------------------------------------------------
-- 4. Constraints
-- ---------------------------------------------------------------------------
-- Postgres has no "add constraint if not exists", so each one is guarded to
-- keep this file safe to re-run.
--
-- NOTE ON WHAT IS *NOT* HERE: the design doc said a CHECK on plan_id would
-- have to be rebuilt to let restaurant rows through. schema.sql shows no CHECK
-- on plan_id — only on `status` and `payment`, neither of which the pivot
-- changes.
--
-- 🔴 BUT schema.sql IS THE ORIGINAL CREATE TABLE, NOT THE LIVE ONE. It is
-- missing `hotel`, which production has had since 2026-09-03. So the sentence
-- above is a reading of a stale file, not a measurement. The verification
-- block at the bottom asks the database directly. If a CHECK on plan_id does
-- come back, STOP: restaurant rows will fail the insert and the whole pivot
-- stalls on its first booking.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'bookings_request_type_check'
  ) then
    alter table public.bookings
      add constraint bookings_request_type_check
      check (request_type is null or request_type in ('tour', 'restaurant'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bookings_fallback_choice_check'
  ) then
    alter table public.bookings
      add constraint bookings_fallback_choice_check
      check (fallback_choice is null or fallback_choice in ('cancel', 'suggest'));
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'bookings_ref_no_key'
  ) then
    alter table public.bookings
      add constraint bookings_ref_no_key unique (ref_no);
  end if;
end $$;

-- Both constraints accept NULL deliberately: existing rows have none of these
-- values, and a migration that rejected them would fail on the spot.

comment on column public.bookings.request_type is
  'tour = we arrange a partner activity (guest pays us nothing). restaurant = we book a table ($10). NULL = charter booking taken before 2026-10-01; code reads it as ''tour''.';

comment on column public.bookings.partner_name is
  'Partner company (tour) or restaurant, first choice (restaurant).';

comment on column public.bookings.fallback_choice is
  'Restaurant only. What the guest chose for a full restaurant: cancel = charge nothing, suggest = propose an alternative (one proposal).';

comment on column public.bookings.ref_no is
  'Reference number shown to partners and restaurants (#0012). Assigned by the database so concurrent requests cannot collide. The four pre-pivot rows take 1-4, so the first October request is #0005 — do not reset the sequence to start at 1.';

-- ---------------------------------------------------------------------------
-- 5. 🔴 VERIFY BEFORE DEPLOYING THE CODE
-- ---------------------------------------------------------------------------
-- Run this and read the result. Six rows must come back. A missing column is
-- not a warning at deploy time — it is every booking failing.
--
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'bookings'
--      and column_name in ('request_type','partner_name','fallback_choice',
--                          'budget_hint','cuisine_hint','ref_no')
--    order by column_name;
--
-- 🔴 And settle the CHECK question by measurement rather than by reading
-- schema.sql, which is two migrations out of date:
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.bookings'::regclass
--    order by conname;
--
-- Expected: checks on status and payment, the two added above, the ref_no
-- unique, and the primary key. If anything constrains plan_id, stop and say
-- so — restaurant rows would fail to insert.
--
-- And confirm existing rows were numbered and left otherwise untouched:
--
--   select ref_no, name, preferred_date, request_type, status, payment
--     from public.bookings order by ref_no;
--
-- request_type must be NULL on every pre-existing row. If any of them came
-- back as 'tour', something backfilled them — stop and say so, because the
-- refund branch keys off exactly that distinction.
