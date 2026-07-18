import fs from "fs";

const rows = JSON.parse(fs.readFileSync("tmp_import/_excel_preview.json", "utf8"));

for (const r of rows) {
  const price = r["Selling Price"] || "";
  const mrp = r.MRP || "";
  const img = r["Images "] ? "YES" : "NO";
  console.log(`[${r.SKU}] price=${price} mrp=${mrp} img=${img}`);
  console.log(`  ${String(r.Title).slice(0, 160)}`);
}
