// Request interception. Two unrelated jobs live here because Next.js allows
// exactly one of these files (in Next.js 16 it is called "proxy"; earlier
// versions called the same thing "middleware"):
//
//   1. Basic Auth on the Admin dashboard and admin APIs.
//   2. 410 Gone for the legacy URLs the owner retired.
//
// The Admin area shows customers' personal information, so it must never be
// publicly accessible in production. This proxy challenges every request to
// /admin and /api/admin/* for a password before the page/route runs.
//
// Configuration (Vercel env var):
//   ADMIN_PASSWORD — the password the owner types to log in. Username is ignored
//                    (type anything), so the owner only remembers one secret.
//
// Fail-safe behavior:
//   • Production with ADMIN_PASSWORD set     → must enter the correct password.
//   • Production with ADMIN_PASSWORD MISSING → access is DENIED (locked shut),
//                                              so private data is never exposed
//                                              by a forgotten env var.
//   • Local development (`npm run dev`)      → auth is skipped for convenience.

import { NextResponse, type NextRequest } from "next/server";
import { RETIRED_BRAND, RETIRED_SERVICE } from "@/lib/legacy-articles";

export const config = {
  matcher: [
    "/admin/:path*",
    "/api/admin/:path*",
    // Retired legacy URLs (see handleRetired below). Listed literally because
    // `matcher` is read statically at build time and cannot be built from the
    // RETIRED_* lists — the assertion under GONE keeps the two in step.
    "/cbd-thc",
    "/drugs",
    "/drug-troubles",
    "/night-life",
    "/night-life-points",
    "/airport-shuttle",
  ],
};

// ---------------------------------------------------------------------------
// Retired legacy URLs — served as 410 Gone.
// ---------------------------------------------------------------------------
// Six articles off the old WordPress site, all indexed, all retired by the
// owner on 2026-07-19 for two different reasons: five on brand grounds
// (RETIRED_BRAND) and one because the service it sells no longer exists
// (RETIRED_SERVICE). The lists stay separate so the reason survives; the
// handling is identical.
//
// WHY 410 AND NOT 404
// Both codes eventually de-index, but they say different things: 404 means
// "not found, maybe it comes back", 410 means "gone, on purpose, stop asking".
// 410 is the honest signal for a deliberate removal, and Google drops the URL
// sooner.
//
// WHY NOT REDIRECT THEM TO /plans
// /cbd-thc/ was 612 clicks a year and it is tempting to point that at the
// booking page. Don't: someone searching for cannabis rules has no intent to
// book a charter, so they bounce, and Google treats a redirect to an unrelated
// page as a soft 404 anyway. It would cost the same traffic and muddy the
// site's topical signal on the way.
//
// The article text is preserved in legacy-archive/ — reversing this decision
// means removing the slug here and from the RETIRED_* list, and adding it back
// to LEGACY_SLUGS.
const GONE = new Set<string>([...RETIRED_BRAND, ...RETIRED_SERVICE]);

// The matcher above is a literal list, so it can drift from the RETIRED_* lists.
// If it ever does, a retired slug would quietly 404 instead of 410 — fail the
// build instead. (Module scope runs when the proxy is compiled.)
const MATCHED_PATHS = config.matcher.filter((m) => !m.includes(":path*"));
for (const slug of GONE) {
  if (!MATCHED_PATHS.includes(`/${slug}`)) {
    throw new Error(
      `proxy: "${slug}" is in RETIRED_BRAND but missing from config.matcher — ` +
        `it would 404 instead of 410. Add "/${slug}" to the matcher.`,
    );
  }
}

function handleRetired(request: NextRequest): NextResponse | null {
  // Old URLs are indexed with a trailing slash; the redirect chain strips it,
  // but match both so a direct hit on either form gets the same answer.
  const slug = request.nextUrl.pathname.replace(/^\/|\/$/g, "");
  if (!GONE.has(slug)) return null;

  return new NextResponse(GONE_HTML, {
    status: 410,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}

// A plain page rather than a bare status: a person following an old link should
// land on something that explains itself and offers a way onward. Inlined
// because the proxy runs on the edge runtime and cannot render a React page.
const GONE_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>このページは公開を終了しました｜Mokaru Guam</title>
<style>
  :root { color-scheme: light; }
  body { margin:0; min-height:100vh; display:flex; align-items:center; justify-content:center;
         background:#faf9f7; color:#1a1a1a; font-family:system-ui,-apple-system,"Segoe UI",sans-serif; }
  main { max-width:34rem; padding:2.5rem 1.25rem; text-align:center; }
  h1 { font-size:1.5rem; margin:0 0 1rem; }
  p { line-height:1.8; color:#555; margin:0 0 1.75rem; }
  a { display:inline-block; background:#e8590c; color:#fff; text-decoration:none;
      font-weight:700; padding:0.75rem 1.5rem; border-radius:9999px; }
</style>
</head>
<body>
<main>
  <h1>このページは公開を終了しました</h1>
  <p>お探しの記事は公開を終了しています。<br>グアムの完全貸切ガイドチャーターについては、こちらをご覧ください。</p>
  <a href="/">Mokaru Guam トップへ</a>
</main>
</body>
</html>`;

function unauthorized(): NextResponse {
  return new NextResponse("Authentication required.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Mokaru Guam Admin", charset="UTF-8"',
    },
  });
}

export function proxy(request: NextRequest) {
  // Retired URLs first, and deliberately above the development check below:
  // this is a public response, not an auth gate, so it must behave the same in
  // `npm run dev` as in production — otherwise it cannot be verified locally.
  const retired = handleRetired(request);
  if (retired) return retired;

  // Local development convenience: skip auth so `npm run dev` admin works.
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const expected = process.env.ADMIN_PASSWORD;

  // Fail closed: if no password is configured in production, deny access.
  if (!expected) {
    return new NextResponse(
      "Admin access is not configured. Set ADMIN_PASSWORD.",
      { status: 503 },
    );
  }

  const header = request.headers.get("authorization");
  if (!header || !header.startsWith("Basic ")) {
    return unauthorized();
  }

  let decoded = "";
  try {
    decoded = atob(header.slice("Basic ".length));
  } catch {
    return unauthorized();
  }

  // Format is "username:password" — username is ignored, only the password matters.
  const password = decoded.slice(decoded.indexOf(":") + 1);

  if (!timingSafeEqual(password, expected)) {
    return unauthorized();
  }

  return NextResponse.next();
}

// Constant-time string comparison to avoid leaking the password via timing.
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
