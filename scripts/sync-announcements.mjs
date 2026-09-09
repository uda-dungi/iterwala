/**
 * Announcement bar — retire festival-branded copy (Sep 2026).
 *
 * The announcement strip is served from the `announcements` table, not from
 * src/config/site.ts — that array is only the fallback for when the table is empty. So
 * renaming the sale in code never reached shoppers: the live row still reads "Raksha
 * Bandhan Sale", two festivals out of date, while the hero banners had already moved on
 * to Janmashtami and then off festivals entirely.
 *
 * This rewrites any festival-named row to the neutral line the rest of the site now uses
 * (SALE_NAME in src/lib/offers.ts), so the bar cannot go stale on a date again.
 *
 * Unlike scripts/seed-divine-series.mjs this one references no images, so it does not
 * have to wait for a deploy — it is pure text and safe to run at any time.
 *
 *   node scripts/sync-announcements.mjs
 *
 * Safe to re-run: rows already carrying the new text are left alone.
 */
import { createClient } from "@supabase/supabase-js";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const env = { ...process.env };
try {
  for (const line of fs.readFileSync(path.join(root, ".env"), "utf8").split(/\r?\n/)) {
    if (!line.includes("=") || line.trim().startsWith("#")) continue;
    const i = line.indexOf("=");
    const k = line.slice(0, i).trim();
    if (env[k] === undefined) env[k] = line.slice(i + 1).trim();
  }
} catch { /* rely on the real environment */ }

const url = env.VITE_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}
const sb = createClient(url, key);

/** Must match SALE_NAME's spirit in src/lib/offers.ts — no festival, no date. */
const NEW_TEXT = "✦ Buy 1 Get 1 Free on Gift Sets ✦";
/** Any live row naming a festival or a wrapped-up sale. */
const FESTIVAL = /raksha\s*bandhan|rakhi|janmashtami|friendship\s*sale|diwali|holi|eid/i;

async function main() {
  const { data, error } = await sb.from("announcements").select("id,text,active").order("position");
  if (error) throw new Error(`reading announcements: ${error.message}`);

  const stale = (data ?? []).filter(a => FESTIVAL.test(a.text ?? ""));
  if (!stale.length) {
    console.log("No festival-branded announcements found — nothing to do.");
  }
  for (const row of stale) {
    const { error: upErr } = await sb.from("announcements").update({ text: NEW_TEXT }).eq("id", row.id);
    if (upErr) throw new Error(`updating ${row.id}: ${upErr.message}`);
    console.log(`updated  "${row.text}"\n      ->  "${NEW_TEXT}"`);
  }

  const { data: after } = await sb.from("announcements").select("text,active").order("position");
  console.log("\nAnnouncement bar now reads:");
  (after ?? []).forEach(a => console.log(`  ${a.active ? "•" : "·(inactive)"} ${a.text}`));
}

main().catch(err => { console.error("\nFAILED:", err.message); process.exit(1); });
