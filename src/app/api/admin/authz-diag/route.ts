// TEMP DIAGNOSTIC (admin-only, protected by proxy Basic auth).
// Fetches the raw PayPal authorization JSON for a given auth id so we can read
// the real denial reason (processor_response, etc.). Delete after diagnosis.
export async function GET(request: Request) {
  const authId = new URL(request.url).searchParams.get("auth");
  if (!authId) {
    return Response.json({ error: "auth param required" }, { status: 400 });
  }
  const env = process.env.PAYPAL_ENV ?? "sandbox";
  const base =
    env === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  const id = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!id || !secret) {
    return Response.json({ error: "PayPal not configured" }, { status: 503 });
  }
  try {
    const basic = Buffer.from(`${id}:${secret}`).toString("base64");
    const tok = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: "grant_type=client_credentials",
    });
    const tokData = (await tok.json()) as { access_token?: string };
    if (!tokData.access_token) {
      return Response.json({ step: "token", body: tokData }, { status: 502 });
    }
    const res = await fetch(
      `${base}/v2/payments/authorizations/${authId}`,
      { headers: { Authorization: `Bearer ${tokData.access_token}` } },
    );
    const text = await res.text();
    return Response.json({ env, httpStatus: res.status, body: text });
  } catch (err) {
    return Response.json({ error: String(err) }, { status: 502 });
  }
}
