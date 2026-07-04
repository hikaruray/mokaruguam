// Server-only PayPal Orders API v2 client.
//
// Flow (matches booking-payment-design.md: authorize → capture):
//   1. createAuthorizeOrder()  — intent=AUTHORIZE, places a hold on the card.
//   2. authorizeOrder()        — moves an APPROVED order to an authorization.
//   3. captureAuthorization()  — on 予約確定, charges the held amount.
//   4. voidAuthorization()     — on お断り, releases the hold (no charge).
//   5. refundCapture()         — reserved for future cancellations (枠のみ).
//
// Secrets: PAYPAL_CLIENT_SECRET is used ONLY here (server side). The public
// client id (NEXT_PUBLIC_PAYPAL_CLIENT_ID) is the only value the browser sees.
//
// Base URL switches on PAYPAL_ENV: "live" → api-m.paypal.com, otherwise sandbox.
//
// When PayPal env vars are unset, isPaypalConfigured() returns false and the
// booking flow runs as request-only (no payment), so local dev & build work.

import "server-only";

const CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const CLIENT_SECRET = process.env.PAYPAL_CLIENT_SECRET;
const ENV = process.env.PAYPAL_ENV ?? "sandbox";

export function isPaypalConfigured(): boolean {
  return Boolean(CLIENT_ID && CLIENT_SECRET);
}

function baseUrl(): string {
  return ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

// fetch with a timeout + small retry. This environment occasionally sees the
// PayPal API fetch hang, so we bound each attempt and retry idempotent-ish GET/
// token calls. Order-mutating calls pass retries=0 to avoid double actions.
async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  { timeoutMs = 12000, retries = 1 }: { timeoutMs?: number; retries?: number } = {},
): Promise<Response> {
  let lastErr: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      lastErr = err;
    } finally {
      clearTimeout(timer);
    }
  }
  throw new Error(
    `PayPal request failed after ${retries + 1} attempt(s): ${String(lastErr)}`,
  );
}

// Cache the OAuth token until shortly before it expires.
let tokenCache: { token: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!isPaypalConfigured()) {
    throw new Error("PayPal is not configured (missing client id/secret).");
  }
  if (tokenCache && Date.now() < tokenCache.expiresAt) {
    return tokenCache.token;
  }

  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
  const res = await fetchWithTimeout(
    `${baseUrl()}/v1/oauth2/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    },
    { retries: 2 },
  );

  if (!res.ok) {
    throw new Error(`PayPal token error ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  tokenCache = {
    token: data.access_token,
    // refresh 60s before actual expiry
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return tokenCache.token;
}

// Error carrying the PayPal HTTP status and issue names, so callers can make
// "already in target state" outcomes idempotent (e.g. PREVIOUSLY_VOIDED).
export class PaypalApiError extends Error {
  status: number;
  issues: string[];
  constructor(message: string, status: number, issues: string[]) {
    super(message);
    this.name = "PaypalApiError";
    this.status = status;
    this.issues = issues;
  }
  hasIssue(...names: string[]): boolean {
    return this.issues.some((i) => names.includes(i));
  }
}

function extractIssues(text: string): string[] {
  try {
    const body = JSON.parse(text) as {
      name?: string;
      details?: { issue?: string }[];
    };
    const issues = (body.details ?? [])
      .map((d) => d.issue)
      .filter((x): x is string => Boolean(x));
    if (body.name) issues.push(body.name);
    return issues;
  } catch {
    return [];
  }
}

async function api<T>(
  path: string,
  method: "POST" | "GET",
  body?: unknown,
  retries = 0,
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetchWithTimeout(
    `${baseUrl()}${path}`,
    {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    },
    { retries },
  );
  const text = await res.text();
  if (!res.ok) {
    throw new PaypalApiError(
      `PayPal ${method} ${path} → ${res.status}: ${text}`,
      res.status,
      extractIssues(text),
    );
  }
  return (text ? JSON.parse(text) : {}) as T;
}

// --- Orders ---------------------------------------------------------------

export interface PaypalOrder {
  id: string;
  status: string;
}

// intent=AUTHORIZE: places a hold. amount is USD, computed server-side.
export async function createAuthorizeOrder(
  amount: number,
  opts: { referenceId?: string; description?: string } = {},
): Promise<PaypalOrder> {
  return api<PaypalOrder>("/v2/checkout/orders", "POST", {
    intent: "AUTHORIZE",
    purchase_units: [
      {
        reference_id: opts.referenceId ?? "mokaru-booking",
        description: opts.description ?? "Mokaru Guam 貸切チャーター（リクエスト予約）",
        amount: { currency_code: "USD", value: amount.toFixed(2) },
      },
    ],
  });
}

// Read an order back (amount verification / status check).
export async function getOrder(orderId: string): Promise<
  PaypalOrder & {
    purchase_units?: { amount?: { value?: string; currency_code?: string } }[];
  }
> {
  return api(`/v2/checkout/orders/${orderId}`, "GET", undefined, 2);
}

// Move an APPROVED order to an authorization. Returns the authorization id
// (needed later to capture or void). Mutating → no retry.
export async function authorizeOrder(
  orderId: string,
): Promise<{ authorizationId: string; status: string }> {
  const data = await api<{
    purchase_units?: {
      payments?: { authorizations?: { id: string; status: string }[] };
    }[];
  }>(`/v2/checkout/orders/${orderId}/authorize`, "POST", {}, 0);

  const authorization =
    data.purchase_units?.[0]?.payments?.authorizations?.[0];
  if (!authorization?.id) {
    throw new Error("PayPal authorize: no authorization id returned.");
  }
  return { authorizationId: authorization.id, status: authorization.status };
}

// Read an authorization back (used to recover an existing capture id when a
// capture call reports the authorization was already captured).
async function getAuthorization(authorizationId: string): Promise<{
  status: string;
  captureId: string | null;
}> {
  const data = await api<{
    status: string;
    supplementary_data?: {
      related_ids?: { capture_ids?: string[] };
    };
  }>(`/v2/payments/authorizations/${authorizationId}`, "GET", undefined, 2);
  const captureId =
    data.supplementary_data?.related_ids?.capture_ids?.[0] ?? null;
  return { status: data.status, captureId };
}

// Capture a previously created authorization (予約確定 → 課金確定).
// IDEMPOTENT: if PayPal reports it was already captured, we look the existing
// capture up and return it as success, so a retry reconciles the DB instead of
// erroring.
export async function captureAuthorization(
  authorizationId: string,
): Promise<{ captureId: string; status: string; alreadyDone: boolean }> {
  try {
    const data = await api<{ id: string; status: string }>(
      `/v2/payments/authorizations/${authorizationId}/capture`,
      "POST",
      {},
      0,
    );
    return { captureId: data.id, status: data.status, alreadyDone: false };
  } catch (err) {
    if (
      err instanceof PaypalApiError &&
      err.hasIssue("AUTHORIZATION_ALREADY_CAPTURED")
    ) {
      const existing = await getAuthorization(authorizationId);
      if (existing.captureId) {
        return {
          captureId: existing.captureId,
          status: existing.status,
          alreadyDone: true,
        };
      }
    }
    throw err;
  }
}

// Void an authorization (お断り → 仮押さえ解除・課金なし).
// IDEMPOTENT: if PayPal reports it was already voided, treat as success.
export async function voidAuthorization(
  authorizationId: string,
): Promise<{ alreadyDone: boolean }> {
  try {
    await api(
      `/v2/payments/authorizations/${authorizationId}/void`,
      "POST",
      {},
      0,
    );
    return { alreadyDone: false };
  } catch (err) {
    if (
      err instanceof PaypalApiError &&
      err.hasIssue("PREVIOUSLY_VOIDED", "AUTHORIZATION_VOIDED")
    ) {
      return { alreadyDone: true };
    }
    throw err;
  }
}

// Refund a capture (キャンセル → 返金).
// IDEMPOTENT: if the capture is already fully refunded, treat as success.
export async function refundCapture(
  captureId: string,
  amount?: number,
): Promise<{ refundId: string | null; status: string; alreadyDone: boolean }> {
  const body =
    amount != null
      ? { amount: { currency_code: "USD", value: amount.toFixed(2) } }
      : {};
  try {
    const data = await api<{ id: string; status: string }>(
      `/v2/payments/captures/${captureId}/refund`,
      "POST",
      body,
      0,
    );
    return { refundId: data.id, status: data.status, alreadyDone: false };
  } catch (err) {
    if (
      err instanceof PaypalApiError &&
      err.hasIssue("CAPTURE_FULLY_REFUNDED", "REFUND_AMOUNT_EXCEEDED")
    ) {
      return { refundId: null, status: "COMPLETED", alreadyDone: true };
    }
    throw err;
  }
}
