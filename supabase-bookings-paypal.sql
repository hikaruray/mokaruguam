-- Mokaru Guam — bookings schema for PayPal (authorize → capture)
-- Run this in the Supabase SQL Editor (owner action).
--
-- Two parts:
--   A) CREATE TABLE IF NOT EXISTS — the shape store.ts expects (safe to re-run).
--   B) ALTER TABLE ADD COLUMN IF NOT EXISTS — adds the PayPal id columns to an
--      EXISTING bookings table (e.g. one shared with another project).
--
-- Only the ALTER statements are strictly required if the table already exists.
-- The columns are snake_case to match store.ts row mapping.

-- A) Base table (skip if it already exists with the right columns) ----------
create table if not exists public.bookings (
  id                       uuid primary key default gen_random_uuid(),
  name                     text not null,
  email                    text not null,
  phone                    text,
  plan_id                  text,
  plan_name                text,
  preferred_date           text,
  guests                   integer,
  spots                    text,
  notes                    text,
  status                   text not null default 'pending',   -- pending|confirmed|declined|cancelled
  payment                  text not null default 'none',      -- none|authorized|captured|refunded
  paypal_order_id          text,
  paypal_authorization_id  text,
  created_at               timestamptz not null default now()
);

-- B) PayPal columns for an EXISTING bookings table --------------------------
alter table public.bookings add column if not exists payment                 text not null default 'none';
alter table public.bookings add column if not exists paypal_order_id         text;
alter table public.bookings add column if not exists paypal_authorization_id text;

-- Optional: index for the Admin list ordering.
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
