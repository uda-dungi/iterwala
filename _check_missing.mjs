import { readFileSync, readdirSync } from "fs";

const src = readFileSync("src/data/products.ts", "utf8");
const names = [...src.matchAll(/img\("([^"]+)"\)/g)].map(m => m[1]);
const uniqueNames = [...new Set(names)];

const files = readdirSync("src/assets/products").filter(f => f.endsWith(".jpg")).map(f => f.replace(/\.jpg$/, ""));
const fileSet = new Set(files);

const missing = uniqueNames.filter(n => !fileSet.has(n));
console.log("Total unique img() names:", uniqueNames.length);
console.log("Missing files:", missing.length);
missing.forEach(m => console.log(" -", m));
