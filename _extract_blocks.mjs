import { readFileSync, writeFileSync } from "fs";
const src = readFileSync("src/data/products.ts", "utf8");
const blocks = src.split(/\n(?=  \{\s*\n\s*id:)/);
const targetIds = new Set([
  "a-amber","a-rajnigandha","a-lavender","a-tulsi","a-ruh-kewra","a-shyam-shringar","a-aseel",
  "p-smoke","p-dubai-fame","p-melody","p-choco-blast","p-blue-ice","a-sukoon","a-oud-wood",
  "a-honeymoon","a-lotus","a-maati","a-ruh-heena","a-ruh-khus","p-black-gold","a-famous",
  "a-feel-good","a-kesar-gulab","p-wild","a-saffron-sandal","p-feel-good","a-impression",
  "a-shanaya","a-khawab","a-noor-jahan","a-fitoor","a-dargah","a-white-oud","a-wild","a-zannat"
]);
let out = "";
for (const b of blocks) {
  const id = b.match(/id:\s*"([^"]+)"/)?.[1];
  if (id && targetIds.has(id)) out += b + "\n";
}
writeFileSync("_target_blocks.txt", out);
console.log("wrote", out.length, "bytes");
