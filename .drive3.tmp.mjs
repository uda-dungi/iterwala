import { chromium } from "playwright";
const SP = "C:/Users/user/AppData/Local/Temp/claude/e--itrawala-main-kamm-itrawala-website/883d38a9-1dd5-458e-8e92-ad4b0968e03f/scratchpad";
const mobile = process.argv[2] === "mobile";
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 900 } : { width: 1440, height: 1150 } });
await ctx.addInitScript(() => {
  const d = new Date().toLocaleDateString("en-CA");
  try { localStorage.setItem("itr_deal_popup_seen", d); localStorage.setItem("itr_email_popup_seen", "1"); } catch {}
});
const page = await ctx.newPage();
await page.goto("http://localhost:8080/product/celebrity", { waitUntil: "domcontentloaded" });
await page.waitForSelector("img", { timeout: 30000 });

// Open the delivery question — it is the one with a policy link in the answer.
const q = page.getByRole("button", { name: /When will it arrive/ });
await q.scrollIntoViewIfNeeded();
await q.click();
await page.waitForTimeout(700);
const region = page.locator('[data-state="open"][role="region"]').last();
console.log("answer text:", (await region.textContent())?.trim().slice(0, 300));
console.log("policy link:", await region.locator("a").getAttribute("href"));
const faq = page.locator("section").filter({ hasText: "Frequently Asked" }).last();
await faq.scrollIntoViewIfNeeded();
await page.waitForTimeout(400);
await faq.screenshot({ path: `${SP}/faq-${mobile ? "mobile" : "desktop"}-open.png` });
await browser.close();
