// The $10 round trip against the real PayPal Sandbox (design §11).
//
//   A. authorize -> capture        (予約確定)
//   B. authorize -> void           (お断り)
//   C. authorize -> capture -> refund  (キャンセル)
//
// Every money-moving step is OUR code: createAuthorizeOrder via the real
// /api/paypal/create-order route, then authorizeOrder / captureAuthorization /
// voidAuthorization / refundCapture from lib/paypal.ts. The ONE step this
// script stands in for is the guest approving the order, which is a PayPal
// popup no script can click; here a sandbox test card confirms the payment
// source instead. So this proves our side end to end and leaves only the
// button itself to a human.
//
// Run against the sandbox dev server: npm run dev:sandbox, then
//   node --experimental-strip-types --import ./scripts/ts-resolve.mjs \
//     scripts/sandbox-roundtrip.ts [port] [cardNumber]
//
// 🔴 Never point this at production. It asserts the base URL is localhost and
// that the credentials are refused by PayPal Live before it moves anything.
const PORT = process.argv[2] ?? "3006";
const CARD = process.argv[3] ?? "4005519200000004";
const ORIGIN = `http://localhost:${PORT}`;

let failed = 0;
function check(ok: boolean, label: string, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` -> ${detail}` : ""}`);
  if (!ok) failed++;
}

// --- Refuse to run anywhere that could touch real money -------------------
if (!/^http:\/\/localhost:/.test(ORIGIN)) {
  console.error("Refusing to run against a non-localhost origin.");
  process.exit(1);
}

const id = process.env.PAYPAL_CLIENT_ID ?? "";
const secret = process.env.PAYPAL_CLIENT_SECRET ?? "";
if (!id || !secret) {
  console.error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET must be set (dev-sandbox passes them through).");
  process.exit(1);
}
const basic = Buffer.from(`${id}:${secret}`).toString("base64");

async function token(host: string): Promise<{ status: number; access?: string }> {
  const res = await fetch(`${host}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  });
  if (res.status !== 200) return { status: res.status };
  const j = (await res.json()) as { access_token: string };
  return { status: 200, access: j.access_token };
}

const live = await token("https://api-m.paypal.com");
check(live.status !== 200, "the credentials are REJECTED by PayPal Live", `HTTP ${live.status}`);
if (live.status === 200) {
  console.error("\n🔴 Live accepted these keys. Stopping before anything moves.");
  process.exit(1);
}

const sb = await token("https://api-m.sandbox.paypal.com");
check(sb.status === 200, "the credentials are ACCEPTED by PayPal Sandbox", `HTTP ${sb.status}`);
if (!sb.access) process.exit(1);
const ACCESS = sb.access;

const SANDBOX = "https://api-m.sandbox.paypal.com";

async function sandboxApi<T>(path: string, method: string, body?: unknown): Promise<{ status: number; data: T }> {
  const res = await fetch(`${SANDBOX}${path}`, {
    method,
    headers: { Authorization: `Bearer ${ACCESS}`, "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, data: (text ? JSON.parse(text) : {}) as T };
}

const {
  authorizeOrder,
  captureAuthorization,
  voidAuthorization,
  refundCapture,
  getAuthorization,
} = await import("@/lib/paypal");

// Create the order through the real route, so the amount is the one the server
// computes rather than one this script chose.
async function newApprovedOrder(label: string): Promise<string | null> {
  const res = await fetch(`${ORIGIN}/api/paypal/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requestType: "restaurant", guests: 2 }),
  });
  const j = (await res.json()) as { id?: string; amount?: number; error?: string };
  check(res.status === 200 && !!j.id, `${label}: /api/paypal/create-order returns an order`, `HTTP ${res.status}${j.error ? ` ${j.error}` : ""}`);
  check(j.amount === 10, `${label}: the server priced it at $10`, `$${j.amount}`);
  if (!j.id) return null;

  // Stand in for the guest: confirm the order's payment source with a sandbox
  // test card. This is the only step that is not our code.
  const confirm = await sandboxApi<{ status?: string; name?: string; details?: unknown }>(
    `/v2/checkout/orders/${j.id}/confirm-payment-source`,
    "POST",
    {
      payment_source: {
        card: {
          number: CARD,
          expiry: "2030-12",
          security_code: "123",
          name: "TEST TARO",
        },
      },
    },
  );
  if (confirm.status !== 200) {
    check(false, `${label}: the sandbox card was accepted`, `HTTP ${confirm.status} ${JSON.stringify(confirm.data).slice(0, 300)}`);
    return null;
  }
  check(confirm.data.status === "APPROVED", `${label}: the order reached APPROVED`, String(confirm.data.status));
  return j.id;
}

// --- A. authorize -> capture ----------------------------------------------
console.log("\n--- A. オーソリ → capture（予約確定）---");
const orderA = await newApprovedOrder("A");
if (orderA) {
  const auth = await authorizeOrder(orderA);
  check(!!auth.authorizationId, "A: our authorizeOrder() places a hold", `${auth.authorizationId} ${auth.status}`);
  const before = await getAuthorization(auth.authorizationId);
  check(before.status === "CREATED", "A: the hold exists and is NOT yet charged", before.status);

  const cap = await captureAuthorization(auth.authorizationId);
  check(cap.status === "COMPLETED", "A: our captureAuthorization() charges it", `${cap.captureId} ${cap.status}`);

  const v = await sandboxApi<{ status: string; amount: { value: string } }>(`/v2/payments/captures/${cap.captureId}`, "GET");
  check(v.data.status === "COMPLETED" && v.data.amount.value === "10.00", "A: PayPal itself reports $10.00 COMPLETED", `${v.data.amount?.value} ${v.data.status}`);
}

// --- B. authorize -> void ---------------------------------------------------
console.log("\n--- B. オーソリ → void（お断り・課金なし）---");
const orderB = await newApprovedOrder("B");
if (orderB) {
  const auth = await authorizeOrder(orderB);
  check(!!auth.authorizationId, "B: our authorizeOrder() places a hold", auth.authorizationId);

  await voidAuthorization(auth.authorizationId);
  const after = await sandboxApi<{ status: string }>(`/v2/payments/authorizations/${auth.authorizationId}`, "GET");
  check(after.data.status === "VOIDED", "B: PayPal reports the hold VOIDED", after.data.status);
  // The point of void: nothing was ever charged.
  const caps = await sandboxApi<{ purchase_units: { payments?: { captures?: unknown[] } }[] }>(`/v2/checkout/orders/${orderB}`, "GET");
  const captured = caps.data.purchase_units?.[0]?.payments?.captures ?? [];
  check(captured.length === 0, "B: the order has NO capture — the guest was never charged", `${captured.length} captures`);
}

// --- C. authorize -> capture -> refund --------------------------------------
console.log("\n--- C. オーソリ → capture → 全額返金（キャンセル）---");
const orderC = await newApprovedOrder("C");
if (orderC) {
  const auth = await authorizeOrder(orderC);
  const cap = await captureAuthorization(auth.authorizationId);
  check(cap.status === "COMPLETED", "C: captured first", `${cap.captureId}`);

  const ref = await refundCapture(cap.captureId);
  check(ref.status === "COMPLETED", "C: our refundCapture() refunds it", `${ref.refundId} ${ref.status}`);

  const v = await sandboxApi<{ status: string; amount: { value: string } }>(`/v2/payments/refunds/${ref.refundId}`, "GET");
  check(v.data.status === "COMPLETED" && v.data.amount.value === "10.00", "C: PayPal itself reports a $10.00 refund", `${v.data.amount?.value} ${v.data.status}`);

  // Refunding twice must not refund twice.
  const again = await refundCapture(cap.captureId);
  check(again.alreadyDone === true, "C: a second refund is a no-op, not a second refund", `alreadyDone=${again.alreadyDone}`);
}

console.log(failed === 0 ? "\nALL PASS" : `\n${failed} FAILED`);
process.exit(failed === 0 ? 0 : 1);
