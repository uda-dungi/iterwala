// One-off: downsizes oversized tracked images under src/assets (max 800px, recompressed).
// Only overwrites a file when the result is smaller. Run: node scripts/optimize-images.mjs
import sharp from "sharp";
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const MAX = 800;
const files = execSync("git ls-files src/assets", { encoding: "utf8", maxBuffer: 1 << 26 })
  .split("\n").filter((f) => /\.(jpe?g|png)$/i.test(f));
let before = 0, after = 0, changed = 0;
for (const f of files) {
  const buf = readFileSync(f);
  before += buf.length;
  let out = buf;
  try {
    const img = sharp(buf).rotate().resize({ width: MAX, height: MAX, fit: "inside", withoutEnlargement: true });
    out = /\.png$/i.test(f)
      ? await img.png({ compressionLevel: 9, effort: 10 }).toBuffer()
      : await img.jpeg({ quality: 74, mozjpeg: true }).toBuffer();
  } catch (e) { console.warn("skip", f, e.message); }
  if (out.length < buf.length * 0.95) { writeFileSync(f, out); after += out.length; changed++; } else after += buf.length;
}
console.log(`${changed}/${files.length} files rewritten: ${(before / 1e6).toFixed(1)}MB -> ${(after / 1e6).toFixed(1)}MB`);
