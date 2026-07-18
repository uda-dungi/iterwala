import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';

const EXCEL = path.join(process.cwd(), 'new price list.xlsx');
const wb = XLSX.readFile(EXCEL);
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

function normalizeText(s) {
  return String(s || '')
    .trim()
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\s*[-–—]\s*/g, ' ')
    .replace(/[“”‘’]/g, "'")
    .replace(/[^0-9a-zA-Z &'"/.,()\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanName(raw) {
  let s = normalizeText(raw);
  s = s.replace(/\b(ml|mL|ML)\b/g, '');
  s = s.replace(/\b(\d+\s*(ml|mL|ML))\b/g, '');
  s = s.replace(/\b(pack|pack of|pack of \d+|pcs|pc|piece|pieces|set|gift set|combo|bundle|box|gift box|sachet|sample)\b/gi, '');
  s = s.replace(/\b(50|100|20|10|30|60|75|15|5|250)\b/g, '');
  s = s.replace(/\b(eau de parfum|eau de perfume|extrait de parfum|attar|itra|attar\/itra|itra\/attar|concentrated attar|natural attar|alcohol-free|alcohal free|perfume oil|fragrance oil|parfum)\b/gi, '');
  s = s.replace(/\b(for men|for women|for unisex|for men and women|unisex|men|women)\b/gi, '');
  s = s.replace(/\b(ml|gr|gm)\b/gi, '');
  s = s.replace(/[()\[\]{}]/g, ' ');
  s = s.replace(/\b(\+|&|and)\b/g, ' and ');
  s = s.replace(/\s+/g, ' ').trim();
  return s.toLowerCase();
}

function getSizeVariant(raw) {
  const s = String(raw || '').toLowerCase();
  const m = s.match(/(\d+\s*ml|\d+ml|\b(?:10|20|30|50|100|250|500)\b)/i);
  if (m) return m[0].toLowerCase();
  if (/pack of\s*\d+/i.test(s)) return s.match(/pack of\s*\d+/i)[0];
  if (/gift set/i.test(s)) return 'gift set';
  if (/duo|trio|quad/i.test(s)) return s.match(/duo|trio|quad/i)[0];
  return null;
}

function canonicalParentName(raw) {
  let name = normalizeText(raw);
  name = name.replace(/\b(\d+\s*ml|\d+ml|10ml|20ml|30ml|50ml|100ml|250ml|500ml)\b/gi, '');
  name = name.replace(/\b(pack of \d+|pack of|gift set|gift box|combo|bundle|set|duo|trio|quad)\b/gi, '');
  name = name.replace(/\b(10|20|30|50|100|250|500)\b/gi, '');
  name = name.replace(/\b(eau de parfum|eau de perfume|extrait de parfum|perfume oil|natural attar|concentrated attar|alcohol-free|attar|itra|i?ttar)\b/gi, '');
  name = name.replace(/\b(for men|for women|unisex|men|women)\b/gi, '');
  name = name.replace(/\b( bottle| spray| spray| perfume| attar| oil| eau\b)/gi, '');
  name = name.replace(/['".]/g, '');
  name = name.replace(/[()\[\]{}]/g, ' ');
  name = name.replace(/\band\b/g, '&');
  name = name.replace(/\s+/g, ' ').trim();
  if (!name) return '';
  return name.toLowerCase();
}

const headerSet = new Set(Object.keys(rows[0] || {}).map((k) => String(k).trim()));
const possibleNameFields = ['Product Name', 'Product', 'Name', 'Title', 'Item Name', 'Title '];
const possibleSkuFields = ['SKU', 'sku', 'S', 'SKU '];
const possibleMrpFields = ['MRP', 'mrp', 'MRP '];
const possiblePriceFields = ['Selling Price', 'Price', 'selling price', 'PRICE'];
const possibleImageFields = ['Image Link', 'Image', 'Images', 'Images ', 'Picture', 'Photo'];

function findField(candidates) {
  for (const key of candidates) {
    if (headerSet.has(key)) return key;
  }
  const lower = [...headerSet].find((h) => candidates.map((c) => c.toLowerCase()).includes(h.toLowerCase()));
  return lower || null;
}

const fieldName = findField(possibleNameFields);
const fieldSku = findField(possibleSkuFields);
const fieldMrp = findField(possibleMrpFields);
const fieldPrice = findField(possiblePriceFields);
const fieldImage = findField(possibleImageFields);

const processed = rows.map((row, index) => {
  const sku = String(row[fieldSku] || row.SKU || row.sku || '').trim();
  const rawName = String(row[fieldName] || row['Title'] || row['Product Name'] || row['Name'] || row['Product'] || '').trim();
  const mrp = row[fieldMrp] != null && row[fieldMrp] !== '' ? Number(row[fieldMrp]) : null;
  const sellingPrice = row[fieldPrice] != null && row[fieldPrice] !== '' ? Number(row[fieldPrice]) : null;
  const imageLink = String(row[fieldImage] || row['Images '] || row['Image Link'] || row['Image'] || '').trim();
  const missing = [];
  if (!sku) missing.push('SKU');
  if (!rawName) missing.push('Product Name');
  if (row[fieldMrp] === '' || row[fieldMrp] == null || Number.isNaN(mrp)) missing.push('MRP');
  if (row[fieldPrice] === '' || row[fieldPrice] == null || Number.isNaN(sellingPrice)) missing.push('Selling Price');
  if (!imageLink) missing.push('Image Link');
  const exactText = JSON.stringify({ sku, rawName, mrp, sellingPrice, imageLink });
  const parentName = canonicalParentName(rawName);
  const size = getSizeVariant(rawName) || getSizeVariant(rawName.replace(/\b(\d+)\s*(ml|ML|Ml)\b/g, '$1ml'));
  const clean = cleanName(rawName);
  return { row: index + 2, sku, rawName, mrp, sellingPrice, imageLink, missing, exactText, parentName, size, clean };
});

const exactDupMap = new Map();
for (const item of processed) {
  exactDupMap.set(item.exactText, (exactDupMap.get(item.exactText) || []).concat(item));
}
const exactDuplicates = [...exactDupMap.values()].filter((group) => group.length > 1);

const incomplete = processed.filter((item) => item.missing.length > 0);
const complete = processed.filter((item) => item.missing.length === 0);

const parentMap = new Map();
for (const item of complete) {
  const key = item.parentName || item.clean || item.rawName.toLowerCase();
  if (!parentMap.has(key)) {
    parentMap.set(key, { key, canonical: item.parentName || item.clean || item.rawName.toLowerCase(), rows: [], variants: new Set(), prices: new Set(), names: new Set() });
  }
  const entry = parentMap.get(key);
  entry.rows.push(item);
  if (item.size) entry.variants.add(item.size);
  if (item.mrp != null) entry.prices.add(item.mrp);
  if (item.sellingPrice != null) entry.prices.add(item.sellingPrice);
  entry.names.add(item.rawName);
}

function similarity(a, b) {
  if (!a || !b) return 0;
  const as = a.split(/\s+/).filter(Boolean);
  const bs = b.split(/\s+/).filter(Boolean);
  const common = as.filter((token) => bs.includes(token));
  return common.length / Math.max(as.length, bs.length);
}

const parentEntries = [...parentMap.values()];
const manualReview = [];
for (let i = 0; i < parentEntries.length; i++) {
  for (let j = i + 1; j < parentEntries.length; j++) {
    const a = parentEntries[i];
    const b = parentEntries[j];
    if (a.key === b.key) continue;
    const sim = similarity(a.key, b.key);
    if (sim >= 0.5 && sim < 1) {
      const avgPriceA = [...a.prices].reduce((sum, v) => sum + v, 0) / Math.max(a.prices.size, 1);
      const avgPriceB = [...b.prices].reduce((sum, v) => sum + v, 0) / Math.max(b.prices.size, 1);
      const priceRatio = Math.min(avgPriceA, avgPriceB) / Math.max(avgPriceA, avgPriceB);
      if (priceRatio > 0.7 || (Math.abs(avgPriceA - avgPriceB) < 200 && sim > 0.65)) {
        manualReview.push({ a: a.key, b: b.key, similarity: Number(sim.toFixed(2)), avgPriceA: Number(avgPriceA.toFixed(2)), avgPriceB: Number(avgPriceB.toFixed(2)), priceRatio: Number(priceRatio.toFixed(2)), countA: a.rows.length, countB: b.rows.length, namesA: [...a.names].slice(0, 3), namesB: [...b.names].slice(0, 3) });
      }
    }
  }
}

const parentProductReport = parentEntries.map((entry) => ({
  parentName: entry.key,
  nameSamples: [...entry.names].slice(0, 5),
  sizeVariants: [...entry.variants].sort(),
  prices: [...entry.prices].sort((a,b) => a - b),
  rowCount: entry.rows.length,
  skuCount: new Set(entry.rows.map((x) => x.sku)).size,
}));

const dataQuality = [];
if (!fieldSku) dataQuality.push('SKU column not detected');
if (!fieldName) dataQuality.push('Product Name column not detected');
if (!fieldMrp) dataQuality.push('MRP column not detected');
if (!fieldPrice) dataQuality.push('Selling Price column not detected');
if (!fieldImage) dataQuality.push('Image Link column not detected');
if (incomplete.length > 0) dataQuality.push(`Found ${incomplete.length} incomplete rows with missing required fields`);
if (exactDuplicates.length > 0) dataQuality.push(`Found ${exactDuplicates.length} sets of exact duplicate rows`);

const report = {
  headers: Object.keys(rows[0] || {}),
  fieldMapping: { fieldName, fieldSku, fieldMrp, fieldPrice, fieldImage },
  totalRows: rows.length,
  totalUniqueParentProducts: parentEntries.length,
  totalExactDuplicateRows: exactDuplicates.reduce((sum, g) => sum + g.length - 1, 0),
  totalExactDuplicateSets: exactDuplicates.length,
  totalSizeVariantsMerged: parentEntries.reduce((sum, e) => Math.max(0, e.rows.length - 1), 0),
  totalCompleteUniqueProducts: complete.length,
  totalIncompleteProducts: incomplete.length,
  incompleteProducts: incomplete.map((item) => ({ row: item.row, sku: item.sku, rawName: item.rawName, missing: item.missing, mrp: item.mrp, sellingPrice: item.sellingPrice, imageLink: item.imageLink })),
  parentProducts: parentProductReport.sort((a,b) => b.rowCount - a.rowCount),
  exactDuplicateSets: exactDuplicates.map((group) => group.map((item) => ({ row: item.row, sku: item.sku, rawName: item.rawName, mrp: item.mrp, sellingPrice: item.sellingPrice, imageLink: item.imageLink }))),
  manualReviewCandidates: manualReview,
  dataQualityIssues: dataQuality,
};
fs.writeFileSync(path.join(process.cwd(), 'tmp_excel_analysis_report.json'), JSON.stringify(report, null, 2));
console.log('report written to tmp_excel_analysis_report.json');
