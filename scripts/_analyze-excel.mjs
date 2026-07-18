import fs from "fs";

const rows = JSON.parse(fs.readFileSync("tmp_import/_excel_preview.json", "utf8"));

function cleanName(title) {
  let t = String(title || "").trim();
  t = t.replace(/^ITRA\s*WALA\s+/i, "").replace(/^Itra\s*Wala\s+/i, "");
  t = t.split("|")[0].trim();
  t = t.replace(/\s*[–—-]\s*\d+\s*ml.*$/i, "");
  t = t.replace(/\s*\d+\s*ml.*$/i, "");
  t = t.replace(/\s*Eau de Parfum.*$/i, "");
  t = t.replace(/\s*Extrait de Parfum.*$/i, "");
  t = t.replace(/\s*Natural Attar.*$/i, " Attar");
  t = t.replace(/\s*Concentrated Attar.*$/i, " Attar");
  t = t.replace(/\s*Alcohol-Free.*$/i, "");
  t = t.replace(/\s*Attar for Men.*$/i, " Attar");
  t = t.replace(/\s*Perfume for Men.*$/i, "");
  t = t.replace(/\s*Luxury Unisex.*$/i, "");
  t = t.replace(/\s*Premium.*$/i, "");
  t = t.replace(/\s*Long-?Lasting.*$/i, "");
  t = t.replace(/\s*for Men.*$/i, "");
  t = t.replace(/\s*&\s*Women.*$/i, "");
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/[,:]+$/, "").trim();
  return t;
}

function cat(title) {
  const t = title.toLowerCase();
  if (/gift\s*set|duo|pack of|combo|discovery/.test(t)) return "Gift Set";
  if (/collector|shabd|kahani|ehsaas|extrait/.test(t)) return "Collector's Edition";
  if (/attar|ittar|itra\b|perfume oil/.test(t) && !/eau de parfum/.test(t)) return "Attar";
  return "Perfume";
}

let ok = 0,
  skipPrice = 0,
  skipImg = 0,
  skipName = 0;
const names = [];
for (const r of rows) {
  const name = cleanName(r.Title);
  const price = Number(r["Selling Price"]);
  const img = String(r["Images "] || "").trim();
  if (!name) {
    skipName++;
    continue;
  }
  if (!price) {
    skipPrice++;
    names.push({ status: "no-price", sku: r.SKU, title: String(r.Title).slice(0, 80), name });
    continue;
  }
  if (!img) {
    skipImg++;
    names.push({ status: "no-img", sku: r.SKU, name, price });
    continue;
  }
  ok++;
  names.push({
    status: "ok",
    sku: r.SKU,
    name,
    price,
    mrp: r.MRP,
    cat: cat(r.Title),
    vol: (String(r.Title).match(/(\d+)\s*ml/i) || [])[1],
  });
}

console.log({ total: rows.length, ok, skipPrice, skipImg, skipName });
const uniq = [...new Set(names.filter((n) => n.status === "ok").map((n) => n.name))];
console.log("unique ok names", uniq.length);
console.log(uniq.join("\n"));
console.log("\n--- skipped ---");
for (const n of names.filter((n) => n.status !== "ok")) {
  console.log(n.status, n.sku, n.name || n.title);
}
console.log("\n--- by category ---");
const byCat = {};
for (const n of names.filter((x) => x.status === "ok")) {
  byCat[n.cat] = (byCat[n.cat] || 0) + 1;
}
console.log(byCat);

// Duplicate names with different volumes/prices
const byName = {};
for (const n of names.filter((x) => x.status === "ok")) {
  (byName[n.name] ||= []).push(n);
}
console.log("\n--- multi-row names ---");
for (const [name, list] of Object.entries(byName)) {
  if (list.length > 1) {
    console.log(name, list.map((x) => `${x.vol || "?"}ml@${x.price}`).join(", "));
  }
}
