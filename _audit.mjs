import { readFileSync } from "fs";
const src = readFileSync("src/data/products.ts", "utf8");
const blocks = src.split(/\n(?=  \{\s*\n\s*id:)/);

const rows = [];
for (const b of blocks) {
  const id = b.match(/id:\s*"([^"]+)"/)?.[1];
  if (!id) continue;
  const slug = b.match(/slug:\s*"([^"]+)"/)?.[1];
  const name = b.match(/name:\s*"([^"]+)"/)?.[1];
  const category = b.match(/category:\s*"([^"]+)"/)?.[1];
  const usesRealGallery = /galleryImagesFor\(|newGalleryImagesFor\(|productGallery2ImagesFor\(|packGalleryFor\(/.test(b);
  const galleryLine = b.match(/gallery:\s*\[([^\]]*)\]/)?.[1] || "";
  const flatImgCount = [...galleryLine.matchAll(/img\(/g)].length;
  rows.push({ id, slug, name, category, usesRealGallery, flatImgCount });
}
console.log("TOTAL products:", rows.length);
console.log("Using real per-size/product gallery folder:", rows.filter(r => r.usesRealGallery).length);
console.log("Flat single/few img() only:", rows.filter(r => !r.usesRealGallery).length);
console.log("");
console.log("=== Products WITHOUT a real gallery folder (flat img() only) ===");
for (const r of rows.filter(r => !r.usesRealGallery)) {
  console.log(`${r.id.padEnd(28)} slug=${(r.slug||"").padEnd(28)} name="${r.name}"  cat=${r.category}  imgs=${r.flatImgCount}`);
}
