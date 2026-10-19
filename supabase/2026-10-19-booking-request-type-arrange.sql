-- 2026-10-19: allow request_type = 'arrange' (3本目：提携外ツアーのお問い合わせ・予約代行 $25)
-- Design: MokaruGuam/arrange-design.md
--
-- WHAT: widen bookings_request_type_check from ('tour','restaurant') to
-- ('tour','restaurant','arrange'). Nothing else changes; no column is added.
--
-- WHY THIS MUST RUN BEFORE THE CODE GOES LIVE: the 2026-10-01 constraint
-- rejects any other value, so an arrange request would fail its INSERT. The
-- booking route voids the PayPal hold when the save fails, so the failure is
-- "the guest sees an error and is not charged" — safe, but every arrange request
-- would be lost until this runs.
--
-- Run once in Supabase → SQL Editor. Safe to run twice.
--
-- 🔴 The lookup names the table (conrelid). This Supabase project is SHARED
-- WITH DaDeal, and constraint names are not unique across tables — see the
-- 2026-10-01 migration for the incident this guards against.

begin;

do $$
begin
  if exists (
    select 1 from pg_constraint
     where conname = 'bookings_request_type_check'
       and conrelid = 'public.bookings'::regclass
  ) then
    alter table public.bookings drop constraint bookings_request_type_check;
  end if;

  alter table public.bookings
    add constraint bookings_request_type_check
    check (request_type is null or request_type in ('tour', 'restaurant', 'arrange'));
end $$;

comment on column public.bookings.request_type is
  'tour = partner activity (free) / restaurant = table booking ($10, captured when the table is held) / arrange = non-partner tour enquiry ($25, captured when the first report is sent). NULL = charter booking taken before 2026-10-01.';

commit;

-- ---------------------------------------------------------------------------
-- Verification — run after the block above. Expect exactly one row whose
-- definition lists all three values.
-- ---------------------------------------------------------------------------
-- select conname, pg_get_constraintdef(oid)
--   from pg_constraint
--  where conrelid = 'public.bookings'::regclass
--    and conname = 'bookings_request_type_check';
