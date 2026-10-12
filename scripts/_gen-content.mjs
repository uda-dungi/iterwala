import XLSX from "xlsx";
import fs from "fs";
const wb = XLSX.readFile(process.argv[2]);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["Website Products"]);
const src = fs.readFileSync("src/data/products.ts", "utf8");
const prods = [...src.matchAll(/^    id: "([^"]+)", slug: "([^"]+)", name: "([^"]+)"/gm)].map(m => ({ id: m[1], slug: m[2], name: m[3] }));
const norm = s => s.toLowerCase().replace(/[^a-z]/g, "");
const alias = { honeymoonattar: "honeymoonattar", khawabattar: "khwaab", worldoffragrancegiftset8perfumes: "pack of 8 gift set", combo1giftset4perfumes: "pack of 4 gift set" };
const out = {}, miss = new Set();
for (const r of rows) {
  const nm = r["Product Name"];
  const isAttar = r.Category === "Attar", isEdp = r.Category === "Eau De Parfum";
  let id;
  const base = nm.replace(/ Eau De Parfum$/, "").replace(/ Attar$/, "");
  const cands = prods.filter(p => isEdp ? p.id.startsWith("p-") : isAttar ? p.id.startsWith("a-") : p.id.startsWith("g-"));
  const key = norm(isAttar ? base : nm.replace(/ Eau De Parfum$/, ""));
  let hit = cands.find(p => norm(p.name) === key || norm(p.name.replace(/ Attar$/, "")) === key);
  if (!hit && alias[norm(nm)]) hit = prods.find(p => norm(p.name) === norm(alias[norm(nm)]));
  if (!hit) { miss.add(nm); continue; }
  (out[hit.id] ??= []).push(r);
}
fs.writeFileSync("tmp_content/grouped.json", JSON.stringify(out, null, 1));
console.log("matched products:", Object.keys(out).length, "rows:", Object.values(out).flat().length, "of", rows.length);
console.log("unmatched:", [...miss]);
console.log("site products w/o sheet:", prods.filter(p => !out[p.id]).map(p => p.name).join(", "));
