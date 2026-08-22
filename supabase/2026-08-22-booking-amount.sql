-- MokaruGuam — record the amount actually charged on each booking
--
-- WHY:
-- `bookings` never stored the price. The confirmation email, the cancellation
-- refund and the Admin revenue totals all RECOMPUTED it from lib/pricing.ts at
-- the moment of the action. That matches only while prices never change.
--
-- The moment a price is changed (this business has changed its pricing before),
-- every earlier booking is restated at the NEW price:
--   • a confirmation email would quote a number that differs from the
--     customer's card statement,
--   • a "50% refund" would mean 50% of today's price, not 50% of what that
--     customer actually paid,
--   • the Admin revenue figures would drift away from the real PayPal takings.
--
-- With this column the price is snapshotted when the card is authorized, and
-- every later step reads that snapshot (see lib/store.ts chargedAmount()).
--
-- Existing rows stay NULL and keep falling back to a recomputation, which is
-- the best information available for them.
--
-- Safe to run more than once (IF NOT EXISTS).

alter table bookings add column if not exists amount numeric(10,2);

comment on column bookings.amount is
  'USD authorized/charged, snapshotted at request time. NULL = taken before this column existed.';
