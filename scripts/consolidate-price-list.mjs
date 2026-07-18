import fs from "fs";
import path from "path";
import XLSX from "xlsx";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXCEL = path.join(ROOT, "new price list.xlsx");
const FALLBACK_EXCEL = path.join(ROOT, "new price list consolidated.xlsx");
const MANIFEST = path.join(ROOT, "tmp_import", "import-manifest.json");

const workbook = XLSX.readFile(EXCEL);
const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8"));

function volumeRank(volume) {
  if (volume === "Gift Box") return 10000;
  const match = String(volume).match(/\d+/);
  return match ? Number(match[0]) : 9999;
}

function priceText(entry) {
  if (!entry) return "";
  const compare = entry.compareAt != null ? ` / MRP ${entry.compareAt}` : "";
  return `SP ${entry.price}${compare}`;
}

const rows = [
  [
    "Product ID",
    "Product Name",
    "Category",
    "Gender",
    "Visible In Sections",
    "Sizes",
    "Size Prices",
    "Primary Selling Price",
    "Primary MRP",
    "Image Key",
  ],
];

const products = [...manifest.groups].sort((a, b) => {
  const category = String(a.category).localeCompare(String(b.category));
  if (category) return category;
  return String(a.name).localeCompare(String(b.name));
});

for (const product of products) {
  const volumeEntries = Object.entries(product.volumes || {}).sort(
    ([a], [b]) => volumeRank(a) - volumeRank(b),
  );
  const primary =
    product.volumes?.["100ml"] ||
    product.volumes?.["Gift Box"] ||
    product.volumes?.["10ml"] ||
    volumeEntries.at(-1)?.[1] ||
    null;

  rows.push([
    product.id,
    product.name,
    product.category,
    "Unisex",
    "Men, Women, Unisex",
    volumeEntries.map(([volume]) => volume).join(", "),
    volumeEntries.map(([volume, entry]) => `${volume}: ${priceText(entry)}`).join(" | "),
    primary?.price ?? "",
    primary?.compareAt ?? "",
    product.imageKey,
  ]);
}

const reviewRows = [
  ["Source Row", "SKU", "Title", "Reason"],
  ...(manifest.skipped || []).map((row) => [
    row.row,
    row.sku,
    row.title,
    row.reason,
  ]),
];

for (const sheetName of ["New Price List", "Needs Review"]) {
  const index = workbook.SheetNames.indexOf(sheetName);
  if (index >= 0) {
    workbook.SheetNames.splice(index, 1);
    delete workbook.Sheets[sheetName];
  }
}

const priceListSheet = XLSX.utils.aoa_to_sheet(rows);
priceListSheet["!cols"] = [
  { wch: 24 },
  { wch: 34 },
  { wch: 20 },
  { wch: 12 },
  { wch: 24 },
  { wch: 24 },
  { wch: 72 },
  { wch: 18 },
  { wch: 14 },
  { wch: 30 },
];
priceListSheet["!autofilter"] = { ref: `A1:J${rows.length}` };
XLSX.utils.book_append_sheet(workbook, priceListSheet, "New Price List");

const reviewSheet = XLSX.utils.aoa_to_sheet(reviewRows);
reviewSheet["!cols"] = [{ wch: 12 }, { wch: 18 }, { wch: 100 }, { wch: 34 }];
reviewSheet["!autofilter"] = { ref: `A1:D${reviewRows.length}` };
XLSX.utils.book_append_sheet(workbook, reviewSheet, "Needs Review");

let output = EXCEL;
try {
  XLSX.writeFile(workbook, EXCEL);
} catch (error) {
  if (error?.code !== "EBUSY") throw error;
  output = FALLBACK_EXCEL;
  XLSX.writeFile(workbook, output);
  console.log(`Original workbook is locked; wrote fallback copy: ${output}`);
}

console.log(`Wrote ${rows.length - 1} products to "New Price List"`);
console.log(`Wrote ${reviewRows.length - 1} rows to "Needs Review"`);
