import { chromium } from "playwright";
const SP = "C:/Users/user/AppData/Local/Temp/claude/e--itrawala-main-kamm-itrawala-website/883d38a9-1dd5-458e-8e92-ad4b0968e03f/scratchpad";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
await ctx.addInitScript(() => {
  const d = new Date().toLocaleDateString("en-CA");
  try { localStorage.setItem("itr_deal_popup_seen", d); localStorage.setItem("itr_email_popup_seen", "1"); } catch {}
});
const page = await ctx.newPage();
const errs = []; page.on("pageerror", (e) => errs.push(e.message));

const countThumbs = () => page.evaluate(() =>
  [...document.querySelectorAll("button")].filter((b) => b.className.includes("aspect-square") && b.querySelector("img")).length);

await page.goto("http://localhost:8080/product/celebrity", { waitUntil: "domcontentloaded" });
await page.waitForSelector("button:has(img)", { timeout: 30000 });

// ---- Reproduce the 100ml shrink ----
console.log("=== Celebrity 100ml gallery ===");
await page.getByRole("button", { name: "100ml", exact: true }).click();
for (let i = 0; i < 8; i++) {
  console.log(`  +${(i * 0.5).toFixed(1)}s after selecting 100ml : ${await countThumbs()} thumbnails`);
  await page.waitForTimeout(500);
}

// ---- FAQ ----
console.log("\n=== FAQ ===");
const faqHeading = page.getByRole("heading", { name: "Frequently Asked" });
await faqHeading.scrollIntoViewIfNeeded();
console.log("heading present :", await faqHeading.count() > 0);
const items = page.locator('button[data-state]:has-text("?")');
const qs = await page.evaluate(() =>
  [...document.querySelectorAll("h3 > button, [data-state] > button, button")]
    .map((b) => b.textContent?.trim() || "")
    .filter((t) => t.endsWith("?")));
console.log("questions       :", qs.length);
qs.forEach((q, i) => console.log(`   ${i + 1}. ${q}`));

// Expand the first one and read the answer.
const first = page.locator("button").filter({ hasText: /\?$/ }).first();
await first.click();
await page.waitForTimeout(600);
const answer = await page.evaluate(() => {
  const open = document.querySelector('[data-state="open"][role="region"], [data-state="open"] [role="region"]');
  return open?.textContent?.trim().slice(0, 220) ?? "(none)";
});
console.log("first answer    :", answer);
await faqHeading.scrollIntoViewIfNeeded();
await page.screenshot({ path: `${SP}/faq-desktop.png` });
console.log("page errors     :", errs.length ? errs.slice(0, 3) : "none");
await browser.close();
