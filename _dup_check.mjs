import { readFileSync } from "fs";
const src = readFileSync("src/data/products.ts", "utf8");

// crude split by product entries using "id:" as anchor
const blocks = src.split(/\n(?=\s*\{\s*\n?\s*id:)/);
const nameToProducts = {};
for (const b of blocks) {
  const idMatch = b.match(/id:\s*"([^"]+)"/);
  const nameMatch = b.match(/name:\s*"([^"]+)"/);
  if (!idMatch) continue;
  const imgNames = [...b.matchAll(/img\("([^"]+)"\)/g)].map(m => m[1]);
  for (const n of new Set(imgNames)) {
    (nameToProducts[n] ??= []).push(`${idMatch[1]} (${nameMatch?.[1] ?? "?"})`);
  }
}
for (const [img, prods] of Object.entries(nameToProducts)) {
  if (prods.length > 1) console.log(img, "=>", prods.join(" | "));
}
