import { llmsTxt } from "@/lib/ai-search";

// /llms.txt — a plain-text summary of the site for AI search tools
// (https://llmstxt.org). Built from lib/ai-search.ts, where every sentence is
// either a constant or a verbatim quote that check:articles verifies; see the
// comment there before editing what it says.
export const dynamic = "force-static";

export function GET() {
  return new Response(llmsTxt(), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
