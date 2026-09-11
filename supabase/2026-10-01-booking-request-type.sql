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
-- 4. Re-authorisation
-- ---------------------------------------------------------------------------
-- A PayPal hold is guaranteed for about three days, and the fee is captured
-- when the restaurant confirms the table — not on the day of the meal. The
-- usual request settles well inside three days. One branch does not: the first
-- choice is full, we propose somewhere else, and the guest takes a few days to
-- answer. By then the hold is dead.
--
-- The owner's decision (2026-09-11) is that we re-authorise FIRST and only then
-- book the table, so we are never left having done the work with no way to
-- charge for it. That requires two things the original six columns did not
-- provide.
--
-- One: somewhere to say the hold died. `payment` has a CHECK listing
-- none/authorized/captured/voided/refunded, and none of them mean "expired".
-- Leaving such a row as `authorized` makes it indistinguishable from a live
-- hold: the admin screen shows money waiting, and the confirm gate tries to
-- capture it and gets a 502 every time.
-- The old constraint is dropped BY DISCOVERY, not by guessing its name. It was
-- written inline on the column in the original CREATE TABLE, so Postgres named
-- it — almost certainly bookings_payment_check, but "almost certainly" is not
-- good enough here: if the real name differs, `drop constraint if exists` would
-- quietly do nothing, the old constraint would survive alongside the new one,
-- and every write of 'expired' would be rejected by a rule nobody could see.
do $$
declare
  c record;
begin
  for c in
    select conname
      from pg_constraint
     where conrelid = 'public.bookings'::regclass
       and contype = 'c'
       and pg_get_constraintdef(oid) ilike '%payment%'
  loop
    execute format('alter table public.bookings drop constraint %I', c.conname);
    raise notice 'dropped payment check: %', c.conname;
  end loop;

  alter table public.bookings
    add constraint bookings_payment_check
    check (payment in ('none','authorized','captured','voided','refunded','expired'));
end $$;

-- Two: somewhere to keep the authorisation we are replacing. paypal_authorization_id
-- holds exactly one id, so re-authorising would overwrite the old one and leave
-- no way to answer "which hold was this booking actually charged on" when
-- reconciling with PayPal. Append, never overwrite.
alter table public.bookings
  add column if not exists previous_authorization_ids text[] not null default '{}';

-- ---------------------------------------------------------------------------
-- 5. Constraints
-- ---------------------------------------------------------------------------
-- Postgres has no "add constraint if not exists", so each one is guarded to
-- keep this file safe to re-run.
--
-- NOTE ON WHAT IS *NOT* HERE: the design doc said a CHECK on plan_id would
-- have to be rebuilt to let restaurant rows through. schema.sql shows no CHECK
-- on plan_id — only on `status`, which the pivot does not change, and on
-- `payment`, which section 4 above rebuilds to admit 'expired'.
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
-- 6. 🔴 VERIFY BEFORE DEPLOYING THE CODE
-- ---------------------------------------------------------------------------
-- Run this and read the result. SEVEN rows must come back. A missing column is
-- not a warning at deploy time — it is every booking failing.
--
--   select column_name, data_type, is_nullable
--     from information_schema.columns
--    where table_schema = 'public'
--      and table_name = 'bookings'
--      and column_name in ('request_type','partner_name','fallback_choice',
--                          'budget_hint','cuisine_hint','ref_no',
--                          'previous_authorization_ids')
--    order by column_name;
--
-- 🔴 And confirm the payment check now admits 'expired'. Section 4 drops every
-- check constraint mentioning payment and adds one back, so exactly one must
-- come out, and it must list six values:
--
--   select conname, pg_get_constraintdef(oid)
--     from pg_constraint
--    where conrelid = 'public.bookings'::regclass
--      and contype = 'c'
--      and pg_get_constraintdef(oid) ilike '%payment%';
--
-- If two rows come back, the old one survived under a name section 4 did not
-- match — stop, because writes of 'expired' will be rejected by whichever one
-- is stricter.
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
