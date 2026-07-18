import fs from 'fs';
import path from 'path';
import XLSX from 'xlsx';
const ROOT = process.cwd();
const EXCEL = path.join(ROOT, 'new price list.xlsx');
const buf = fs.readFileSync(EXCEL);
const wb = XLSX.read(buf, { type: 'buffer' });
const sheet = wb.Sheets[wb.SheetNames[0]];
const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');

const NAME_ALIASES = {
  'jannat firadaus': 'Jannat Firdaus',
  'honey moon': 'Honeymoon',
  honeymoon: 'Honeymoon',
  'ocean water': 'Ocean Water',
  'oud wood': 'Oud Wood',
  'white musk': 'White Musk',
  'rose petals': 'Rose Petals',
  'black gold': 'Black Gold',
  'blue ice': 'Blue Ice',
  'dubai fame': 'Dubai Fame',
  'choco blast': 'Choco Blast',
  'feel good': 'Feel Good',
  'kesar gulab': 'Kesar Gulab',
  'royal oud': 'Royal Oud',
  'shahi gulab': 'Shahi Gulab',
  'mogra gold': 'Mogra Gold',
  'rooh chandan': 'Rooh Chandan',
  'ruh heena': 'Ruh Heena',
  'ruh khus': 'Ruh Khus',
  'ruh kewra': 'Ruh Kewra',
  'ruh mogra': 'Ruh Mogra',
  'shyam shringar': 'Shyam Shringar',
  'saffron sandal': 'Saffron Sandal',
  'white oud': 'White Oud',
  'noor jahan': 'Noor Jahan',
  'frozen blue & ocean water': 'Aqua Duo Gift Set',
  'frozen blue and ocean water': 'Aqua Duo Gift Set',
};
const KNOWN_PRODUCTS = [
  'Celebrity', 'Impression', 'Inayat', 'Oud Wood', 'Sukoon', 'Touch', 'Ocean Water',
  'White Musk', 'Temptation', 'Rose Petals', 'Legend', 'Million', 'Smoke', 'Dubai Fame',
  'Valentine', 'Aura', 'Melody', 'Choco Blast', 'Honeymoon', 'Blue Ice', 'Black Gold',
  'Wild', 'Chemistry', 'Poetry', 'Rebel', 'Wanted', 'Feel Good',
  'Royal Oud', 'Shahi Gulab', 'Mogra Gold', 'Rooh Chandan', 'Jannat Firdaus', 'Amber',
  'Rajnigandha', 'Lavender', 'Tulsi', 'Ruh Kewra', 'Shyam Shringar', 'Aseel', 'Lotus',
  'Maati', 'Ruh Heena', 'Ruh Khus', 'Ruh Mogra', 'Famous', 'Guldasta', 'Kesar Gulab',
  'Shanaya', 'Khawab', 'Noor Jahan', 'Fitoor', 'Dargah', 'White Oud', 'Zannat',
  'Saffron Sandal', 'Choco Blast',
];

function titleCase(s) {
  return String(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(And|Of|The|For|In|On|A|An)\b/g, (m) => m.toLowerCase())
    .replace(/^\w/, (m) => m.toUpperCase());
}
function parenName(title) {
  const m = String(title).match(/\(([^)]+)\)\s*$/);
  if (!m) return null;
  const inner = m[1].trim();
  if (/^\d+\s*ml$/i.test(inner)) return null;
  if (/^\d+\s*ml\)$/i.test(inner)) return null;
  const cleaned = inner.replace(/\s*\d+\s*ml$/i, '').trim();
  if (cleaned.length >= 2 && cleaned.length < 40) return cleaned;
  return null;
}
function canonicalize(name, category) {
  let n = String(name).trim();
  n = n.replace(/\s+/g, ' ');
  n = n.replace(/\s+(Attar|Perfume|Itra|Ittar)$/i, '').trim();
  const key = n.toLowerCase();
  if (NAME_ALIASES[key]) n = NAME_ALIASES[key];
  else n = titleCase(n);
  return n;
}
function displayName(name, category) {
  if (category === 'Attar') {
    const needsSuffix = [
      'Celebrity', 'Impression', 'Inayat', 'Oud Wood', 'Sukoon', 'Touch', 'Million',
      'Smoke', 'Temptation', 'Honeymoon', 'Wild', 'Feel Good', 'White Oud', 'Choco Blast',
    ];
    if (needsSuffix.includes(name)) return `${name} Attar`;
  }
  return name;
}
function detectCategory(title, sku) {
  const t = String(title).toLowerCase();
  const s = String(sku || '').toLowerCase();
  if (/gift\s*set|pack of\s*[248]|combo|discovery|2\s*pc|2pc|duo|4\s*x\s*20|4x20/i.test(t) || /aquaseries|pack of|itw-00[89]|itw-01[0-4]/i.test(s)) {
    return 'Gift Set';
  }
  if (/shabd|kahani|ehsaas|collector|extrait/.test(t)) return "Collector's Edition";
  if (/cocentrated attar|concentrated attar|itra\/attar|attar\/itra|natural attar|perfume oil|alcohal free|alcohol-free.*attar|attar for men|non-?\s*alcholic|ittar/i.test(t) || /^itw-005-/i.test(s)) {
    return 'Attar';
  }
  if (/attar/.test(t) && !/eau de parfum|eau-da-perfume|perfume for/.test(t)) return 'Attar';
  return 'Perfume';
}
function extractVolume(title, sku) {
  const blob = `${title} ${sku}`;
  const m = blob.match(/(\d+)\s*ml/i);
  if (m) return `${m[1]}ml`;
  if (/pack of|gift|combo|duo/i.test(blob)) return 'Gift Box';
  if (/attar|itra|ittar|10\s*ml/i.test(blob)) return '10ml';
  return null;
}
function extractName(title, sku, category) {
  const raw = String(title || '');
  const s = String(sku || '');
  if (category === 'Gift Set') {
    if (/frozen\s*blue.*ocean|ocean.*frozen/i.test(raw)) return 'Aqua Duo Gift Set';
    if (/lavender.*rajnigandha|rajnigandha.*lavender/i.test(raw)) return 'Premium Attar Duo';
    if (/mogra\s*gold.*shahi\s*gulab|shahi\s*gulab.*mogra/i.test(raw)) return 'Mogra Gold & Shahi Gulab Duo';
    if (/rooh\s*chandan/i.test(raw) && /pack of\s*2|duo|2\s*pc/i.test(raw)) return 'Rooh Chandan Duo';
    if (/royal\s*oud.*shyam|shyam.*royal\s*oud/i.test(raw)) return 'Royal Oud & Shyam Shringar Duo';
    if (/white\s*oud.*black\s*oud|black\s*oud.*white\s*oud/i.test(raw)) return 'White Oud & Black Oud Duo';
    if (/pack of\s*8|8\s*mini|8\s*ml\s*x\s*8|8ml each/i.test(raw) || /pack of\s*8/i.test(s)) return 'Signature Discovery Set';
    if (/pack of\s*4|4\s*x\s*20|4x20|combo\s*1|touch.*wild.*temptation|signature quad/i.test(raw) || /pack of\s*4/i.test(s) || /ITW-00[89]|ITW-01[012]/i.test(s)) return 'Signature Quad Gift Set';
    if (/royal\s*oud/i.test(raw) && /2\s*pc|2pc|pack of\s*2/i.test(raw)) return 'Royal Oud Duo';
  }
  const fromParen = parenName(raw);
  if (fromParen && !/^\d/.test(fromParen) && !/^(combo|pack|standard)\b/i.test(fromParen)) {
    return canonicalize(fromParen, category);
  }
  const skuHints = [
    [/celebrity/i, 'Celebrity'],
    [/impression/i, 'Impression'],
    [/inayat/i, 'Inayat'],
    [/million/i, 'Million'],
    [/smoke/i, 'Smoke'],
    [/temptation/i, 'Temptation'],
    [/valentine/i, 'Valentine'],
    [/ocean\s*water/i, 'Ocean Water'],
    [/oud\s*wood/i, 'Oud Wood'],
    [/honeymoon|honey\s*moon/i, 'Honeymoon'],
    [/feel\s*good/i, 'Feel Good'],
    [/choco\s*blast/i, 'Choco Blast'],
    [/aura/i, 'Aura'],
    [/wild/i, 'Wild'],
    [/touch/i, 'Touch'],
    [/white\s*oud/i, 'White Oud'],
    [/famous/i, 'Famous'],
    [/guldasta/i, 'Guldasta'],
    [/khawab/i, 'Khawab'],
    [/noor\s*jahan/i, 'Noor Jahan'],
    [/zannat/i, 'Zannat'],
    [/sukun|sukoon|secret\s*crush/i, 'Sukoon'],
    [/poetry/i, 'Poetry'],
    [/rebel/i, 'Rebel'],
    [/wanted/i, 'Wanted'],
    [/black\s*gold/i, 'Black Gold'],
  ];
  for (const [re, name] of skuHints) {
    if (re.test(s)) return canonicalize(name, category);
  }
  const sorted = [...KNOWN_PRODUCTS].sort((a, b) => b.length - a.length);
  const lower = raw.toLowerCase();
  for (const name of sorted) {
    if (lower.includes(name.toLowerCase())) {
      return canonicalize(name, category);
    }
  }
  let t = raw.replace(/^ITRA\s*WALA\s+/i, '').replace(/^Itra\s*Wala\s+/i, '');
  t = t.split('|')[0].trim();
  t = t.replace(/\s*[–—-]\s*\d+\s*ml.*$/i, '');
  t = t.replace(/\([^)]*\)/g, ' ');
  t = t.replace(/\s*\d+\s*ml.*$/i, '');
  t = t.replace(/\s*Eau de Parfum.*$/i, '');
  t = t.replace(/\s*Eau de Perfume.*$/i, '');
  t = t.replace(/\s*Extrait de Parfum.*$/i, '');
  t = t.replace(/\s*Natural Attar.*$/i, '');
  t = t.replace(/\s*Concentrated Attar.*$/i, '');
  t = t.replace(/\s*Cocentrated Attar.*$/i, '');
  t = t.replace(/\s*Itra\/Attar.*$/i, '');
  t = t.replace(/\s*Attar\/Itra.*$/i, '');
  t = t.replace(/\s*Alcohol-Free.*$/i, '');
  t = t.replace(/\s*for Men.*$/i, '');
  t = t.replace(/\s*&\s*Women.*$/i, '');
  t = t.replace(/\s*Perfume.*$/i, '');
  t = t.replace(/\s*Attar.*$/i, '');
  t = t.replace(/\s*Premium.*$/i, '');
  t = t.replace(/\s*Long-?Lasting.*$/i, '');
  t = t.replace(/\s*Luxury.*$/i, '');
  t = t.replace(/\s+/g, ' ').trim();
  t = t.replace(/[,:]+$/, '').trim();
  if (!t || t.length < 2 || t.length > 48) return null;
  return canonicalize(t, category);
}
function groupRows(rows) {
  const groups = new Map();
  for (const r of rows) {
    const title = String(r.Title || r['Title'] || '').trim();
    const sku = String(r.SKU || r.SKU || '').trim();
    const price = Number(r['Selling Price'] || r.price || 0) || null;
    const imageUrl = String(r['Images '] || r.Images || '').trim();
    if (!title || !price || !imageUrl) continue;
    const category = detectCategory(title, sku);
    const name = extractName(title, sku, category);
    if (!name) continue;
    const volume = extractVolume(title, sku) || (category === 'Attar' ? '10ml' : category === 'Gift Set' ? 'Gift Box' : '100ml');
    let volumeNorm = volume;
    if (category === 'Attar') volumeNorm = '10ml';
    else if (category === 'Gift Set') volumeNorm = 'Gift Box';
    else if (category === 'Perfume' && !/^\d+ml$/.test(volume)) volumeNorm = '100ml';
    else if (category === 'Perfume' && volume === '10ml') volumeNorm = '100ml';
    const key = `${category}|${name.toLowerCase()}`;
    if (!groups.has(key)) {
      groups.set(key, { key, name, category, volumes: {}, imageCandidates: [], rows: [] });
    }
    const g = groups.get(key);
    g.volumes[volumeNorm] = { price, compareAt: null };
    g.imageCandidates.push({ url: imageUrl, volume: volumeNorm, price });
    g.rows.push(r);
  }
  return [...groups.values()];
}

const groupValues = groupRows(rows);
console.log('total rows', rows.length);
console.log('valid rows', rows.filter(r => { const title=String(r.Title||r['Title']||'').trim(); const price=Number(r['Selling Price']||r.price||0); const image=String(r['Images ']||r.Images||'').trim(); return title && price && image; }).length);
console.log('grouped products', groupValues.length);
console.log(groupValues.map(g => ({ key: g.key, count: g.rows.length })).slice(0,20));
