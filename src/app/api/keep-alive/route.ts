import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// Keep-alive for the free-tier Supabase project.
//
// A free Supabase project auto-pauses after ~1 week with no activity. When it
// does, the Admin dashboard (and every DB-backed feature) goes down with a 500
// while the public pages keep working — exactly the outage we hit on
// 2026-07-20. A single lightweight query counts as activity and resets that
// timer, so a daily Vercel Cron hit here keeps the project awake for $0, with
// no need to upgrade to Pro just to avoid the auto-pause.
//
// The query is a HEAD/count on bookings: it moves no rows, depends on no column
// name, and returns nothing about the data. This route is intentionally NOT
// behind the Admin Basic Auth (proxy.ts only guards /admin and /api/admin/*),
// so the scheduler can reach it. It exposes only { ok, ranAt } — no data.
//
// Scheduled from vercel.json → crons. See MEMORY: supabase-free-tier-pauses.

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  // If CRON_SECRET is configured, require it — Vercel Cron sends it as a Bearer
  // token automatically. Without it set the endpoint is still safe (harmless
  // read, no data returned), so keep-alive works with zero extra config.
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
  }

  const supabase = getSupabase();
  if (!supabase) {
    // No Supabase configured (e.g. local `npm run dev`) — nothing to keep alive.
    return NextResponse.json({ ok: true, db: "not-configured" });
  }

  const { error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ranAt: new Date().toISOString() });
}
