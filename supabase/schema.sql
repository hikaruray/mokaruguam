-- MokaruGuam — Supabase schema
-- Run this in the Supabase SQL Editor once, after creating the project.
-- Mirrors src/lib/store.ts (the `bookings` table). The app writes/reads from
-- the server using the SERVICE ROLE key, so RLS below is defense-in-depth.

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
