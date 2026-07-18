import fs from "fs";

const PRODUCTS_TS = "src/data/products.ts";
let src = fs.readFileSync(PRODUCTS_TS, "utf8");
src = src
  .replace(/const modules[\s\S]*?^};$/m, "const img = (name) => name;")
  .replace(/^export type Product[\s\S]*?^};$/m, "")
  .replace(/^export const defaultVolumes[\s\S]*?;$/m, "const defaultVolumes = ['50ml','100ml'];")
  .replace(/^export const collections[\s\S]*?^] as const;$/m, "")
  .replace(/export const products: Product\[\] =/, "const products =")
  .replace(/^export const getProduct[\s\S]*/m, "\n;products;\n");

try {
  const fn = new Function(`${src}\nreturn products;`);
  const products = fn();
  console.log("loaded", products.length, products[0].id, products[0].image);
  console.log("last", products[products.length - 1].id);
} catch (e) {
  console.error("FAIL", e.message);
  // Show around error
  console.log("--- transformed head ---");
  console.log(src.slice(0, 800));
}
