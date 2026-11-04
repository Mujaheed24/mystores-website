// Checks a LIVE site: every shop on the home page must open, and every shop and product in the sitemap must open.
// Usage:  node scripts/check-site.mjs https://your-site.vercel.app
// Run it after each deployment and after editing a shop (for example, change a banner, then run it straight away).
const base = (process.argv[2] || "").replace(/\/$/, "");
if (!/^https?:\/\//.test(base)) { console.error("Give the site address, e.g.  node scripts/check-site.mjs https://mystores.vercel.app"); process.exit(1); }
const get = async (path) => { const r = await fetch(base + path, { redirect: "follow", headers: { "cache-control": "no-cache" } }); return { status: r.status, body: await r.text() }; };
const bad = [];
const check = async (path, why) => {
  try {
    const { status, body } = await get(path);
    const closed = body.includes("This shop is not open") || body.includes("could not be found");
    if (status !== 200 || closed) bad.push(`${path}  (${why}) -> ${status}${closed ? ", shows 'not open'" : ""}`);
    return status === 200 && !closed;
  } catch (e) { bad.push(`${path}  (${why}) -> ${e.message}`); return false; }
};
const home = await get("/");
const shops = [...new Set([...home.body.matchAll(/href="\/([a-z0-9-]+)"/g)].map((m) => m[1]))].filter((s) => !["sell", "dashboard", "admin", "help", "terms", "privacy"].includes(s));
console.log(`Home page: ${home.status}, ${shops.length} shop(s) listed`);
if (home.status !== 200) bad.push(`/ -> ${home.status}`);
if (home.body.includes("could not load the shops")) bad.push("home page says it could not load the shops");
if (shops.length === 0) bad.push("home page lists no shops (is that expected?)");
for (const s of shops) await check(`/${s}`, "listed on the home page");
try {
  const sm = (await get("/sitemap.xml")).body, urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(/^https?:\/\/[^/]+/, ""));
  console.log(`Sitemap: ${urls.length} address(es)`);
  for (const u of urls.filter((u) => u && !shops.includes(u.slice(1)))) await check(u, "in the sitemap");
} catch (e) { bad.push(`sitemap -> ${e.message}`); }
if (bad.length) { console.log("\nPROBLEMS:"); bad.forEach((b) => console.log(" - " + b)); process.exit(2); }
console.log("\nAll good: every listed shop opens.");
