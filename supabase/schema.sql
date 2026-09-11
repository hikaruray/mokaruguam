-- MokaruGuam — Supabase schema (INITIAL DDL — NOT the current table)
-- Run this in the Supabase SQL Editor once, after creating the project.
--
-- 🔴 THIS FILE IS THE ORIGINAL CREATE TABLE, NOT A MIRROR OF THE LIVE TABLE.
-- It has been behind since 2026-09-03: `hotel` is missing here while
-- store.ts inserts it and production accepts it. The columns added by the
-- Oct 1 pivot are missing too. Migrations live beside it, one file per change:
--   2026-08-22-booking-amount.sql
--   2026-09-03-booking-hotel.sql
--   2026-10-01-booking-request-type.sql
--
-- So do NOT read this file to answer "what does the table look like now" —
-- that mistake was made on 2026-09-11, when it was cited as proof that no
-- CHECK constraint exists on plan_id. Ask the database:
--   select column_name, data_type from information_schema.columns
--    where table_name = 'bookings' order by ordinal_position;
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--    where conrelid = 'public.bookings'::regclass;
--
-- The app writes/reads from the server using the SERVICE ROLE key, so the RLS
-- below is defense-in-depth.

-- ---------- Booking requests ----------
create table if not exists public.bookings (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text not null,
  phone          text not null default '',
  plan_id        text not null default '',
  plan_name      text not null default '',
  preferred_date text not null default '',
  guests         integer not null default 0,
  spots          text not null default '',
  notes          text not null default '',
  status         text not null default 'pending'
                 check (status in ('pending', 'confirmed', 'declined', 'cancelled')),
  -- PayPal authorize→capture flow (booking-payment-design.md):
  --   none=request-only, authorized=hold, captured=charged,
  --   voided=hold released (お断り), refunded=charged then refunded (キャンセル)
  payment        text not null default 'none'
                 check (payment in ('none', 'authorized', 'captured', 'voided', 'refunded')),
  -- USD authorized/charged, snapshotted at request time. Prices change over
  -- time, so later steps (confirmation email, refund, revenue totals) must read
  -- this rather than recomputing from lib/pricing.ts.
  amount                  numeric(10,2),
  paypal_order_id         text,
  paypal_authorization_id text,
  paypal_capture_id       text,     -- capture id (needed to refund later)
  refund_amount           numeric,  -- USD refunded on cancellation (if any)
  refund_rate             numeric,  -- 0..1 refund rate applied on cancel
  created_at     timestamptz not null default now()
);

create index if not exists bookings_created_idx on public.bookings (created_at desc);
create index if not exists bookings_status_idx on public.bookings (status, created_at desc);

-- ---------- Security ----------
-- The app talks to Supabase only from server-side code using the SERVICE ROLE
-- key (never exposed to the browser), which bypasses RLS. With RLS enabled and
-- no public policies, the anon/public key cannot read or write bookings.
alter table public.bookings enable row level security;
