// Ask Bing (and the other IndexNow engines) to re-crawl the site now.
//
//   node scripts/indexnow.mjs            # dry run: prints what it would send
//   node scripts/indexnow.mjs --send     # sends
//
// WHY (2026-10-19)
// ChatGPT search reads largely from Bing's index, and Bing still held the home
// page and /about as they were before 10/1 — the charter, "3時間 $170〜" —
// while /dining, /plans and /tipping were not in it at all. Bing re-crawls a
// small site on its own schedule, which can be weeks. IndexNow tells it which
// URLs changed.
//
// 🔴 Run --send only AFTER the change is live on www.mokaruguam.com (the owner
// approves every production push). Bing fetches the key file below from the
// live site to verify the request; before the deploy it 404s and the ping is
// rejected. Sending once per deploy is enough — repeated pings for unchanged
// URLs are ignored and can count against the site.
//
// The key is public by design (it is served at /<key>.txt); it proves only
// that whoever pings controls the site's files.
const KEY = "bce8a69597c32786ed3c8732fcd46c32";
const HOST = "www.mokaruguam.com";
const ORIGIN = `https://${HOST}`;

const send = process.argv.includes("--send");

const xml = await (await fetch(`${ORIGIN}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
urls.push(`${ORIGIN}/llms.txt`);

const keyRes = await fetch(`${ORIGIN}/${KEY}.txt`);
const keyOk = keyRes.ok && (await keyRes.text()).trim() === KEY;
console.log(`${urls.length} URLs from the live sitemap; key file live: ${keyOk}`);

if (!send) {
  console.log(urls.slice(0, 10).join("\n") + (urls.length > 10 ? "\n…" : ""));
  console.log("\nDry run. Add --send to submit.");
  process.exit(0);
}
if (!keyOk) {
  console.error("Key file is not live yet — deploy first.");
  process.exit(1);
}

const res = await fetch("https://api.indexnow.org/indexnow", {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({ host: HOST, key: KEY, keyLocation: `${ORIGIN}/${KEY}.txt`, urlList: urls }),
});
// 200 = accepted, 202 = accepted, key not yet verified. Anything else failed.
console.log(`IndexNow: ${res.status} ${await res.text()}`);
process.exit(res.status === 200 || res.status === 202 ? 0 : 1);
