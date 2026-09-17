// `npm run dev` for the PayPal money round-trip: real PayPal Sandbox, nothing
// else real.
//
// Why this exists, and why dev-offline.mjs is not enough:
//   `npm run dev`        -> LIVE Supabase + LIVE Resend + PayPal  (writes real rows, sends real mail)
//   dev-offline.mjs      -> everything blanked, PayPal INCLUDED   (so the pay button never appears)
//   this script          -> PayPal Sandbox ON, everything else blanked
//
// So this is the only way to click authorize -> capture / void / refund end to
// end without touching the live database, the live mailbox, or a real card.
//
//   Supabase -> local JSON store (.data/db.json)   Resend -> logged, not sent
//   ADMIN_PASSWORD -> blank, so /admin is open     PayPal -> real Sandbox API
//
// 🔴 The guard below is the point of this file. Before Next starts, we ask
// PayPal for a token on BOTH hosts. The credentials must be accepted by
// sandbox AND rejected by live. A live key would be rejected by sandbox and so
// could never reach this check by accident -- but a key that live ACCEPTS is
// refused outright, because a capture here would charge a real card.
// PAYPAL_ENV is then forced to "sandbox" rather than trusted from .env.local.
import { spawn } from "node:child_process";

// Blanked, not deleted: Next's env loader does not overwrite a variable that
// already exists, even an empty one, so an empty value survives .env.local
// while a deleted one would be filled straight back in.
const blank = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "ADMIN_PASSWORD",
];

const env = { ...process.env };
for (const k of blank) env[k] = "";
env.PAYPAL_ENV = "sandbox";

// Read the PayPal credentials the same way Next will: .env.local, unless the
// shell already set them.
import { readFileSync } from "node:fs";

function fromEnvFile(file) {
  const out = {};
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    return out;
  }
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m) out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

// `.env.sandbox.local` is optional and wins when present, so a separate set of
// sandbox keys can be kept out of .env.local. Plain Next never reads this file.
const fileEnv = { ...fromEnvFile(".env.local"), ...fromEnvFile(".env.sandbox.local") };

const clientId = process.env.PAYPAL_CLIENT_ID || fileEnv.PAYPAL_CLIENT_ID || "";
const secret =
  process.env.PAYPAL_CLIENT_SECRET || fileEnv.PAYPAL_CLIENT_SECRET || "";

function die(message) {
  console.error(`\n🔴 dev-sandbox refused to start.\n\n${message}\n`);
  process.exit(1);
}

if (!clientId || !secret) {
  die(
    "No PayPal credentials found in .env.local or .env.sandbox.local.\n" +
      "Put a Sandbox app's PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET in one of them.",
  );
}

// Retried, because this environment intermittently fails the PayPal fetch for
// reasons unrelated to the credentials (lib/paypal.ts retries for the same
// reason). Without this, a network blip reads as "your keys are wrong".
async function token(host) {
  const auth = Buffer.from(`${clientId}:${secret}`).toString("base64");
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(`${host}/v1/oauth2/token`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${auth}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: "grant_type=client_credentials",
        signal: AbortSignal.timeout(15000),
      });
      return res.status;
    } catch (err) {
      lastErr = err;
    }
  }
  // Refuse rather than assume: an unverified pair must not reach a capture.
  die(
    `Could not reach ${host} after 3 attempts: ${String(lastErr)}\n` +
      "This is usually the network, not the credentials. Try again.",
  );
}

console.log("Verifying the PayPal credentials before starting...");
const sandboxStatus = await token("https://api-m.sandbox.paypal.com");
const liveStatus = await token("https://api-m.paypal.com");

if (liveStatus === 200) {
  die(
    "These credentials are accepted by PayPal LIVE. A capture would charge a\n" +
      "real card. Replace PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET with a\n" +
      "Sandbox app's keys (developer.paypal.com -> Apps & Credentials ->\n" +
      "Sandbox tab) before running this.",
  );
}

if (sandboxStatus !== 200) {
  die(
    `PayPal Sandbox rejected these credentials (HTTP ${sandboxStatus}).\n` +
      "Check that the client id and secret are copied whole, from the same\n" +
      "Sandbox app, with no trailing spaces or line breaks.",
  );
}

// Force the verified pair onto the child, so .env.local cannot substitute a
// different one, and point the browser SDK at the same id.
env.PAYPAL_CLIENT_ID = clientId;
env.PAYPAL_CLIENT_SECRET = secret;
env.NEXT_PUBLIC_PAYPAL_CLIENT_ID =
  fileEnv.NEXT_PUBLIC_PAYPAL_CLIENT_ID || clientId;

console.log("✅ sandbox: accepted   ✅ live: rejected   -> no real card can be charged");
console.log("   Supabase: local JSON (.data/db.json)   Resend: logged, not sent   /admin: open\n");

const port = process.argv[2] ?? "3006";
const child = spawn("npx", ["next", "dev", "-p", port], {
  env,
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
