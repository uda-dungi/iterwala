import { chromium } from "playwright";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
await ctx.addInitScript(() => {
  const d = new Date().toLocaleDateString("en-CA");
  try { localStorage.setItem("itr_deal_popup_seen", d); localStorage.setItem("itr_email_popup_seen", "1"); } catch {}
});
const page = await ctx.newPage();
const t0 = Date.now();
const el = () => ((Date.now() - t0) / 1000).toFixed(1).padStart(5);
page.on("response", async (r) => {
  if (r.url().includes("/rest/v1/products")) console.log(`${el()}s  <- products query responded (${r.status()})`);
  if (r.url().includes("/rest/v1/product_images")) console.log(`${el()}s  <- product_images query responded (${r.status()})`);
});

const count = () => page.evaluate(() =>
  [...document.querySelectorAll("button")].filter((b) => b.className.includes("aspect-square") && b.querySelector("img")).length);

await page.goto("http://localhost:8080/product/celebrity", { waitUntil: "domcontentloaded" });
await page.waitForSelector("button:has(img)", { timeout: 30000 });
await page.getByRole("button", { name: "100ml", exact: true }).click();
console.log(`${el()}s  -- selected 100ml --`);
let last = null;
for (let i = 0; i < 40; i++) {
  const n = await count();
  if (n !== last) { console.log(`${el()}s  thumbnails = ${n}`); last = n; }
  await page.waitForTimeout(500);
}
await browser.close();
