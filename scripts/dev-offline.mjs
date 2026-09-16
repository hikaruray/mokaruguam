// `npm run dev` with every external service switched off.
//
// 🔴 Plain `npm run dev` reads .env.local, and .env.local points at the LIVE
// Supabase project shared with DaDeal — so clicking through the admin screen
// locally writes real rows. This wrapper starts the same dev server with those
// variables set to EMPTY (not deleted: Next's env loader does not overwrite a
// variable that already exists, even an empty one, so an empty value survives
// .env.local while a deleted one would be filled straight back in).
//
//   Supabase -> local JSON store      Resend -> logs instead of sending
//   PayPal   -> not configured        ADMIN_PASSWORD -> dev access is open
import { spawn } from "node:child_process";

const blank = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "RESEND_API_KEY",
  "PAYPAL_CLIENT_ID",
  "PAYPAL_CLIENT_SECRET",
  "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  "ADMIN_PASSWORD",
];
const env = { ...process.env };
for (const k of blank) env[k] = "";

const port = process.argv[2] ?? "3005";
const child = spawn("npx", ["next", "dev", "-p", port], {
  env,
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 0));
