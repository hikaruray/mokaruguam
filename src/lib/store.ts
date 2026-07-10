// Storage layer for booking requests (mirrors the GuamJobs store.ts design).
//
// Two backends, selected automatically at runtime:
//   • Supabase  — used when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//                 (production on Vercel, which cannot write to the filesystem).
//   • Local JSON — fallback for local development when those env vars are unset,
//                 so `npm run dev` works with no external account.
//
// The exported function SIGNATURES are identical in both modes, so the rest of
// the app (API routes, Admin) is backend-agnostic.
//
// Payment (PayPal): the `payment` field tracks the "authorize on request →
// capture on confirm / void on reject → refund on cancel" flow (see
// booking-payment-design.md). It stays "none" for request-only submissions
// (when PayPal env vars are unset).

import "server-only";
import { promises as fs } from "fs";
import path from "path";
import { getSupabase } from "./supabase";

export type BookingStatus = "pending" | "confirmed" | "declined" | "cancelled";
export type PaymentStatus =
  | "none"       // request-only, no online payment
  | "authorized" // held (仮押さえ)
  | "captured"   // charged (決済確定)
  | "voided"     // hold released without charge (お断り→解除)
  | "refunded";  // captured then refunded (キャンセル→返金)

export interface BookingRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  planId: string;       // e.g. "middle" (see lib/pricing.ts)
  planName: string;     // human label at time of request
  preferredDate: string; // free-text preferred date/time (e.g. "7/20 午後")
  guests: number;
  spots: string;        // free-text wishlist of places to visit
  notes: string;        // any extra requests
  status: BookingStatus;
  payment: PaymentStatus;
  paypalOrderId: string | null;         // PayPal order (intent=AUTHORIZE)
  paypalAuthorizationId: string | null; // authorization to capture/void later
  paypalCaptureId: string | null;       // capture id (needed to refund later)
  refundAmount: number | null;          // USD refunded on cancellation (if any)
  refundRate: number | null;            // 0..1 refund rate applied on cancel
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Row <-> app-object mapping (Supabase snake_case <-> camelCase interface)
// ---------------------------------------------------------------------------

function rowToBooking(row: Record<string, unknown>): BookingRequest {
  return {
    id: String(row.id),
    name: String(row.name),
    email: String(row.email),
    phone: String(row.phone ?? ""),
    planId: String(row.plan_id ?? ""),
    planName: String(row.plan_name ?? ""),
    preferredDate: String(row.preferred_date ?? ""),
    guests: Number(row.guests ?? 0),
    spots: String(row.spots ?? ""),
    notes: String(row.notes ?? ""),
    status: (row.status as BookingStatus) ?? "pending",
    payment: (row.payment as PaymentStatus) ?? "none",
    paypalOrderId: (row.paypal_order_id as string) ?? null,
    paypalAuthorizationId: (row.paypal_authorization_id as string) ?? null,
    paypalCaptureId: (row.paypal_capture_id as string) ?? null,
    refundAmount:
      row.refund_amount != null ? Number(row.refund_amount) : null,
    refundRate: row.refund_rate != null ? Number(row.refund_rate) : null,
    createdAt: String(row.created_at),
  };
}

// ---------------------------------------------------------------------------
// Local JSON fallback (development only)
// ---------------------------------------------------------------------------

interface DB {
  bookings: BookingRequest[];
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "db.json");

async function readFile(): Promise<DB> {
  try {
    const raw = await fs.readFile(DB_FILE, "utf8");
    return JSON.parse(raw) as DB;
  } catch {
    return { bookings: [] };
  }
}

async function writeFile(db: DB): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_FILE, JSON.stringify(db, null, 2), "utf8");
}

function localId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ---------------------------------------------------------------------------
// Booking requests
// ---------------------------------------------------------------------------

export async function addBooking(
  data: Omit<
    BookingRequest,
    | "id"
    | "status"
    | "payment"
    | "paypalOrderId"
    | "paypalAuthorizationId"
    | "paypalCaptureId"
    | "refundAmount"
    | "refundRate"
    | "createdAt"
  > & {
    // Optional payment fields — set when the request went through PayPal.
    payment?: PaymentStatus;
    paypalOrderId?: string | null;
    paypalAuthorizationId?: string | null;
  },
): Promise<BookingRequest> {
  const payment: PaymentStatus = data.payment ?? "none";
  const paypalOrderId = data.paypalOrderId ?? null;
  const paypalAuthorizationId = data.paypalAuthorizationId ?? null;

  const supabase = getSupabase();

  if (supabase) {
    const { data: inserted, error } = await supabase
      .from("bookings")
      .insert({
        name: data.name,
        email: data.email,
        phone: data.phone,
        plan_id: data.planId,
        plan_name: data.planName,
        preferred_date: data.preferredDate,
        guests: data.guests,
        spots: data.spots,
        notes: data.notes,
        status: "pending",
        payment,
        paypal_order_id: paypalOrderId,
        paypal_authorization_id: paypalAuthorizationId,
      })
      .select()
      .single();
    if (error) throw new Error(`Failed to save booking: ${error.message}`);
    return rowToBooking(inserted as Record<string, unknown>);
  }

  const booking: BookingRequest = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    planId: data.planId,
    planName: data.planName,
    preferredDate: data.preferredDate,
    guests: data.guests,
    spots: data.spots,
    notes: data.notes,
    id: localId(),
    status: "pending",
    payment,
    paypalOrderId,
    paypalAuthorizationId,
    paypalCaptureId: null,
    refundAmount: null,
    refundRate: null,
    createdAt: new Date().toISOString(),
  };
  const db = await readFile();
  db.bookings.unshift(booking);
  await writeFile(db);
  return booking;
}

export async function listBookings(): Promise<BookingRequest[]> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(`Failed to load bookings: ${error.message}`);
    return (data ?? []).map(rowToBooking);
  }

  return (await readFile()).bookings;
}

export async function getBooking(id: string): Promise<BookingRequest | null> {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Failed to load booking: ${error.message}`);
    return data ? rowToBooking(data as Record<string, unknown>) : null;
  }

  return (await readFile()).bookings.find((b) => b.id === id) ?? null;
}

export async function setBookingStatus(
  id: string,
  status: BookingStatus,
): Promise<void> {
  const supabase = getSupabase();

  if (supabase) {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (error) throw new Error(`Failed to update booking: ${error.message}`);
    return;
  }

  const db = await readFile();
  const booking = db.bookings.find((b) => b.id === id);
  if (booking) booking.status = status;
  await writeFile(db);
}

// Update payment state after a capture / void / refund. Accepts the new payment
// status plus optional PayPal capture id and refund details (for the Admin
// display). Kept separate from status so the admin action can set both.
export interface PaymentPatch {
  payment: PaymentStatus;
  paypalCaptureId?: string | null;
  refundAmount?: number | null;
  refundRate?: number | null;
}

export async function setBookingPayment(
  id: string,
  patch: PaymentPatch,
): Promise<void> {
  const supabase = getSupabase();

  if (supabase) {
    const update: Record<string, unknown> = { payment: patch.payment };
    if (patch.paypalCaptureId !== undefined)
      update.paypal_capture_id = patch.paypalCaptureId;
    if (patch.refundAmount !== undefined)
      update.refund_amount = patch.refundAmount;
    if (patch.refundRate !== undefined) update.refund_rate = patch.refundRate;

    const { error } = await supabase
      .from("bookings")
      .update(update)
      .eq("id", id);
    if (error) throw new Error(`Failed to update payment: ${error.message}`);
    return;
  }

  const db = await readFile();
  const booking = db.bookings.find((b) => b.id === id);
  if (booking) {
    booking.payment = patch.payment;
    if (patch.paypalCaptureId !== undefined)
      booking.paypalCaptureId = patch.paypalCaptureId;
    if (patch.refundAmount !== undefined)
      booking.refundAmount = patch.refundAmount;
    if (patch.refundRate !== undefined) booking.refundRate = patch.refundRate;
  }
  await writeFile(db);
}
