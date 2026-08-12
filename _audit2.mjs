import { readFileSync, writeFileSync } from "fs";
const src = readFileSync("src/data/products.ts", "utf8");
const blocks = src.split(/\n(?=  \{\s*\n\s*id:)/);

const rows = [];
for (const b of blocks) {
  const id = b.match(/id:\s*"([^"]+)"/)?.[1];
  if (!id) continue;
  const slug = b.match(/slug:\s*"([^"]+)"/)?.[1];
  const name = b.match(/name:\s*"([^"]+)"/)?.[1];
  const category = b.match(/category:\s*"([^"]+)"/)?.[1];
  const volumeMatch = b.match(/volume:\s*\[([^\]]*)\]/);
  const volumes = volumeMatch ? [...volumeMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]) : [];
  const usesRealGallery = /galleryImagesFor\(|newGalleryImagesFor\(|productGallery2ImagesFor\(|packGalleryFor\(/.test(b);
  rows.push({ id, slug, name, category, volumes, usesRealGallery });
}
writeFileSync("_products_audit.json", JSON.stringify(rows, null, 2));
console.log("done", rows.length);
