/**
 * Import products from "new price list.xlsx" into the static catalog.
 *
 * - Downloads Google Drive images → src/assets/products/{slug}.jpg
 * - Upserts entries in src/data/products.ts (no duplicates)
 * - Syncs api/_lib/prices.ts
 * - Sets gender to Unisex for every imported product
 *
 * Usage:  node scripts/import-products.mjs
 *         npm run import:products
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const EXCEL = path.join(ROOT, "new price list.xlsx");
const PRODUCTS_TS = path.join(ROOT, "src", "data", "products.ts");
const PRICES_TS = path.join(ROOT, "api", "_lib", "prices.ts");
const IMG_DIR = path.join(ROOT, "src", "assets", "products");
const LOG_DIR = path.join(ROOT, "tmp_import");
const MANIFEST = path.join(LOG_DIR, "import-manifest.json");

fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(LOG_DIR, { recursive: true });

// ─── helpers ─────────────────────────────────────────────────────────────────

const slugify = (s) =>
  String(s)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");

const titleCase = (s) =>
  String(s)
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase())
    .replace(/\b(And|Of|The|For|In|On|A|An)\b/g, (m) => m.toLowerCase())
    .replace(/^\w/, (m) => m.toUpperCase());

function extractDriveId(url) {
  if (!url) return null;
  const m = String(url).match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (m) return m[1];
  const m2 = String(url).match(/[?&]id=([a-zA-Z0-9_-]+)/);
  return m2 ? m2[1] : null;
}

function isHtmlBuffer(buf) {
  if (!buf || buf.length < 100) return true;
  const head = buf.slice(0, 400).toString("utf8").toLowerCase();
  return head.includes("<html") || head.includes("<!doctype");
}

async function downloadDrive(fileId, destPath) {
  const urls = [
    `https://drive.google.com/uc?export=download&id=${fileId}&confirm=t`,
    `https://drive.google.com/uc?export=download&id=${fileId}`,
  ];
  let lastErr = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const ab = await res.arrayBuffer();
      const buf = Buffer.from(ab);
      if (isHtmlBuffer(buf)) {
        // Virus-scan interstitial — try confirm token if present
        const html = buf.toString("utf8");
        const token = html.match(/confirm=([0-9A-Za-z_-]+)/)?.[1];
        if (token) {
          const res2 = await fetch(
            `https://drive.google.com/uc?export=download&id=${fileId}&confirm=${token}`,
            { redirect: "follow" },
          );
          const buf2 = Buffer.from(await res2.arrayBuffer());
          if (!isHtmlBuffer(buf2) && buf2.length > 5000) {
            await optimizeAndSave(buf2, destPath);
            return { ok: true, bytes: buf2.length };
          }
        }
        lastErr = new Error("Got HTML instead of image (Drive scan page)");
        continue;
      }
      if (buf.length < 3000) {
        lastErr = new Error(`File too small (${buf.length} bytes)`);
        continue;
      }
      await optimizeAndSave(buf, destPath);
      return { ok: true, bytes: buf.length };
    } catch (e) {
      lastErr = e;
    }
  }
  return { ok: false, error: lastErr?.message || "download failed" };
}

async function optimizeAndSave(buf, destPath) {
  // Re-encode as JPEG, max 1600px on the long side, quality ~82
  const out = await sharp(buf)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(destPath, out);
}

async function ensurePlaceholderImage(destPath) {
  if (fs.existsSync(destPath) && fs.statSync(destPath).size > 8000) return;
  const out = await sharp({
    create: { width: 1200, height: 1200, channels: 3, background: "#d8d8d8" },
  })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();
  fs.writeFileSync(destPath, out);
}

function numberOrNull(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function findImageUrl(row) {
  for (const value of Object.values(row)) {
    if (typeof value !== "string") continue;
    const trimmed = value.trim();
    if (/\bhttps?:\/\/.*drive\.google\.com\b/i.test(trimmed)) return trimmed;
    if (/\bhttps?:\/\/.*lh3\.googleusercontent\.com\b/i.test(trimmed)) return trimmed;
  }
  return null;
}

// ─── name / category extraction ──────────────────────────────────────────────

/** Known aliases → canonical display name used on the site */
const NAME_ALIASES = {
  "jannat firadaus": "Jannat Firdaus",
  "honey moon": "Honeymoon",
  honeymoon: "Honeymoon",
  "ocean water": "Ocean Water",
  "oud wood": "Oud Wood",
  "white musk": "White Musk",
  "rose petals": "Rose Petals",
  "black gold": "Black Gold",
  "blue ice": "Blue Ice",
  "dubai fame": "Dubai Fame",
  "choco blast": "Choco Blast",
  "feel good": "Feel Good",
  "kesar gulab": "Kesar Gulab",
  "royal oud": "Royal Oud",
  "shahi gulab": "Shahi Gulab",
  "mogra gold": "Mogra Gold",
  "rooh chandan": "Rooh Chandan",
  "ruh heena": "Ruh Heena",
  "ruh khus": "Ruh Khus",
  "ruh kewra": "Ruh Kewra",
  "ruh mogra": "Ruh Mogra",
  "shyam shringar": "Shyam Shringar",
  "saffron sandal": "Saffron Sandal",
  "white oud": "White Oud",
  "noor jahan": "Noor Jahan",
  "frozen blue & ocean water": "Aqua Duo Gift Set",
  "frozen blue and ocean water": "Aqua Duo Gift Set",
};

const KNOWN_PRODUCTS = [
  "Celebrity", "Impression", "Inayat", "Oud Wood", "Sukoon", "Touch", "Ocean Water",
  "White Musk", "Temptation", "Rose Petals", "Legend", "Million", "Smoke", "Dubai Fame",
  "Valentine", "Aura", "Melody", "Choco Blast", "Honeymoon", "Blue Ice", "Black Gold",
  "Wild", "Chemistry", "Poetry", "Rebel", "Wanted", "Feel Good",
  "Royal Oud", "Shahi Gulab", "Mogra Gold", "Rooh Chandan", "Jannat Firdaus", "Amber",
  "Rajnigandha", "Lavender", "Tulsi", "Ruh Kewra", "Shyam Shringar", "Aseel", "Lotus",
  "Maati", "Ruh Heena", "Ruh Khus", "Ruh Mogra", "Famous", "Guldasta", "Kesar Gulab",
  "Shanaya", "Khawab", "Noor Jahan", "Fitoor", "Dargah", "White Oud", "Zannat",
  "Saffron Sandal", "Choco Blast",
];

function parenName(title) {
  const m = String(title).match(/\(([^)]+)\)\s*$/);
  if (!m) return null;
  const inner = m[1].trim();
  // Skip volume-only parens like "(100 ml)" or SKU junk
  if (/^\d+\s*ml$/i.test(inner)) return null;
  if (/^\d+\s*ml\)$/i.test(inner)) return null;
  // "Choco Blast 100ml" → Choco Blast
  const cleaned = inner.replace(/\s*\d+\s*ml$/i, "").trim();
  if (cleaned.length >= 2 && cleaned.length < 40) return cleaned;
  return null;
}

function detectCategory(title, sku) {
  const t = String(title).toLowerCase();
  const s = String(sku || "").toLowerCase();

  if (
    /gift\s*set|pack of\s*[248]|combo|discovery|2\s*pc|2pc|duo|4\s*x\s*20|4x20/i.test(t) ||
    /aquaseries|pack of|itw-00[89]|itw-01[0-4]/i.test(s)
  ) {
    return "Gift Set";
  }
  if (/shabd|kahani|ehsaas|collector|extrait/.test(t)) return "Collector's Edition";
  if (
    /cocentrated attar|concentrated attar|itra\/attar|attar\/itra|natural attar|perfume oil|alcohal free|alcohol-free.*attar|attar for men|non-?\s*alcholic|ittar/i.test(t) ||
    /cocentrated attar|concentrated attar/i.test(s) ||
    /^itw-005-/i.test(s)
  ) {
    return "Attar";
  }
  if (/attar/.test(t) && !/eau de parfum|eau-da-perfume|perfume for/.test(t)) return "Attar";
  return "Perfume";
}

function extractVolume(title, sku) {
  const blob = `${title} ${sku}`;
  const m = blob.match(/(\d+)\s*ml/i);
  if (m) return `${m[1]}ml`;
  // Gift sets
  if (/pack of|gift|combo|duo/i.test(blob)) return "Gift Box";
  if (/attar|itra|ittar|10\s*ml/i.test(blob)) return "10ml";
  return null;
}

function extractName(title, sku, category) {
  const raw = String(title || "");
  const s = String(sku || "");

  // Gift sets first — titles are noisy and parentheses often say "Combo 1"
  if (category === "Gift Set") {
    if (/frozen\s*blue.*ocean|ocean.*frozen/i.test(raw)) return "Aqua Duo Gift Set";
    if (/lavender.*rajnigandha|rajnigandha.*lavender/i.test(raw)) return "Premium Attar Duo";
    if (/mogra\s*gold.*shahi\s*gulab|shahi\s*gulab.*mogra/i.test(raw)) return "Mogra Gold & Shahi Gulab Duo";
    if (/rooh\s*chandan/i.test(raw) && /pack of\s*2|duo|2\s*pc/i.test(raw)) return "Rooh Chandan Duo";
    if (/royal\s*oud.*shyam|shyam.*royal\s*oud/i.test(raw)) return "Royal Oud & Shyam Shringar Duo";
    if (/white\s*oud.*black\s*oud|black\s*oud.*white\s*oud/i.test(raw)) return "White Oud & Black Oud Duo";
    if (/pack of\s*8|8\s*mini|8\s*ml\s*x\s*8|8ml each/i.test(raw) || /pack of\s*8/i.test(s)) {
      return "Signature Discovery Set";
    }
    if (
      /pack of\s*4|4\s*x\s*20|4x20|combo\s*1|touch.*wild.*temptation|signature quad/i.test(raw) ||
      /pack of\s*4/i.test(s) ||
      /ITW-00[89]|ITW-01[012]/i.test(s)
    ) {
      return "Signature Quad Gift Set";
    }
    if (/royal\s*oud/i.test(raw) && /2\s*pc|2pc|pack of\s*2/i.test(raw)) return "Royal Oud Duo";
  }

  // Parenthetical name (ITW-005-AR → Amber) — skip junk like "Combo 1" / volumes
  const fromParen = parenName(raw);
  if (
    fromParen &&
    !/^\d/.test(fromParen) &&
    !/^(combo|pack|standard)\b/i.test(fromParen)
  ) {
    return canonicalize(fromParen, category);
  }

  // SKU-based hints
  const skuHints = [
    [/celebrity/i, "Celebrity"],
    [/impression/i, "Impression"],
    [/inayat/i, "Inayat"],
    [/million/i, "Million"],
    [/smoke/i, "Smoke"],
    [/temptation/i, "Temptation"],
    [/valentine/i, "Valentine"],
    [/ocean\s*water/i, "Ocean Water"],
    [/oud\s*wood/i, "Oud Wood"],
    [/honeymoon|honey\s*moon/i, "Honeymoon"],
    [/feel\s*good/i, "Feel Good"],
    [/choco\s*blast/i, "Choco Blast"],
    [/aura/i, "Aura"],
    [/wild/i, "Wild"],
    [/touch/i, "Touch"],
    [/white\s*oud/i, "White Oud"],
    [/famous/i, "Famous"],
    [/guldasta/i, "Guldasta"],
    [/khawab/i, "Khawab"],
    [/noor\s*jahan/i, "Noor Jahan"],
    [/zannat/i, "Zannat"],
    [/sukun|sukoon|secret\s*crush/i, "Sukoon"],
    [/poetry/i, "Poetry"],
    [/rebel/i, "Rebel"],
    [/wanted/i, "Wanted"],
    [/black\s*gold/i, "Black Gold"],
  ];
  for (const [re, name] of skuHints) {
    if (re.test(s)) return canonicalize(name, category);
  }

  // Scan known product names inside title (longest first)
  const sorted = [...KNOWN_PRODUCTS].sort((a, b) => b.length - a.length);
  const lower = raw.toLowerCase();
  for (const name of sorted) {
    if (lower.includes(name.toLowerCase())) {
      return canonicalize(name, category);
    }
  }

  // Fallback: strip brand + marketing fluff
  let t = raw.replace(/^ITRA\s*WALA\s+/i, "").replace(/^Itra\s*Wala\s+/i, "");
  t = t.split("|")[0].trim();
  t = t.replace(/\s*[–—-]\s*\d+\s*ml.*$/i, "");
  t = t.replace(/\([^)]*\)/g, " ");
  t = t.replace(/\s*\d+\s*ml.*$/i, "");
  t = t.replace(/\s*Eau de Parfum.*$/i, "");
  t = t.replace(/\s*Eau de Perfume.*$/i, "");
  t = t.replace(/\s*Extrait de Parfum.*$/i, "");
  t = t.replace(/\s*Natural Attar.*$/i, "");
  t = t.replace(/\s*Concentrated Attar.*$/i, "");
  t = t.replace(/\s*Cocentrated Attar.*$/i, "");
  t = t.replace(/\s*Itra\/Attar.*$/i, "");
  t = t.replace(/\s*Attar\/Itra.*$/i, "");
  t = t.replace(/\s*Alcohol-Free.*$/i, "");
  t = t.replace(/\s*for Men.*$/i, "");
  t = t.replace(/\s*&\s*Women.*$/i, "");
  t = t.replace(/\s*Perfume.*$/i, "");
  t = t.replace(/\s*Attar.*$/i, "");
  t = t.replace(/\s*Premium.*$/i, "");
  t = t.replace(/\s*Long-?Lasting.*$/i, "");
  t = t.replace(/\s*Luxury.*$/i, "");
  t = t.replace(/\s+/g, " ").trim();
  t = t.replace(/[,:]+$/, "").trim();
  if (!t || t.length < 2 || t.length > 48) return null;
  return canonicalize(t, category);
}

function canonicalize(name, category) {
  let n = String(name).trim();
  n = n.replace(/\s+/g, " ");
  // Strip trailing "Attar"/"Perfume" — category encodes that
  n = n.replace(/\s+(Attar|Perfume|Itra|Ittar)$/i, "").trim();
  const key = n.toLowerCase();
  if (NAME_ALIASES[key]) n = NAME_ALIASES[key];
  else n = titleCase(n);

  // Display name for attars that share a perfume name
  if (category === "Attar") {
    const perfumeNames = new Set([
      "Celebrity", "Impression", "Inayat", "Oud Wood", "Sukoon", "Touch", "Million",
      "Smoke", "Temptation", "Honeymoon", "Wild", "Feel Good",
    ]);
    if (perfumeNames.has(n) && !/Attar$/i.test(n)) {
      // Keep base name for matching; we'll add " Attar" in displayName later if needed
    }
  }
  return n;
}

function displayName(name, category) {
  if (category === "Attar") {
    const needsSuffix = [
      "Celebrity", "Impression", "Inayat", "Oud Wood", "Sukoon", "Touch", "Million",
      "Smoke", "Temptation", "Honeymoon", "Wild", "Feel Good", "White Oud", "Choco Blast",
    ];
    if (needsSuffix.includes(name)) return `${name} Attar`;
  }
  return name;
}

function makeId(name, category) {
  const base = slugify(name);
  if (category === "Attar") return `a-${base}`;
  if (category === "Gift Set") return `g-${base.replace(/-gift-set$/, "").replace(/-duo$/, "")}`.replace(/-$/, "") || `g-${base}`;
  if (category === "Collector's Edition") return `ce-${base}`;
  return `p-${base}`;
}

function makeSlug(name, category) {
  const base = slugify(name);
  if (category === "Attar") {
    // Match existing patterns: sukoon-attar, oud-wood-attar, or plain for unique attars
    const clash = [
      "celebrity", "impression", "inayat", "oud-wood", "sukoon", "touch", "million",
      "smoke", "temptation", "honeymoon", "wild", "feel-good", "white-oud", "choco-blast",
    ];
    if (clash.includes(base)) return `${base}-attar`;
    return base;
  }
  if (category === "Gift Set") {
    if (base.includes("discovery")) return "discovery-set";
    if (base.includes("aqua-duo")) return "aqua-duo-gift-set";
    if (base.includes("attar-duo") || base.includes("premium-attar")) return "attar-duo-gift-set";
    if (base.includes("signature-quad")) return "signature-quad-gift-set";
    if (base.includes("rooh-chandan")) return "rooh-chandan-duo-gift-set";
    if (base.includes("white-oud") && base.includes("black")) return "whiteoud-blackoud-gift-set";
    if (base.includes("mogra") && base.includes("shahi")) return "mogragold-shahigulab-gift-set";
    if (base.includes("royal-oud") && base.includes("shyam")) return "royaloud-shyamshringar-gift-set";
    if (!base.endsWith("gift-set") && !base.endsWith("set")) return `${base}-gift-set`;
    return base;
  }
  return base;
}

function imageKey(name, category) {
  const base = slugify(name);
  if (category === "Attar") {
    // Prefer attar-{name} when a perfume of the same name exists
    const perfumeClash = [
      "celebrity", "impression", "inayat", "oud-wood", "sukoon", "touch", "million",
      "smoke", "temptation", "honeymoon", "wild", "feel-good",
    ];
    if (perfumeClash.includes(base)) return `attar-${base}`;
    // Existing catalog uses attar-lotus, attar-maati, etc. for some; plain for others
    const preferAttarPrefix = ["lotus", "maati", "ruh-heena", "ruh-khus", "ruh-mogra", "ruh-kewra",
      "royal-oud", "shahi-gulab", "mogra-gold", "rooh-chandan", "jannat-firdaus", "amber",
      "rajnigandha", "lavender", "tulsi", "shyam-shringar", "aseel", "choco-blast"];
    if (preferAttarPrefix.includes(base)) return `attar-${base}`;
    return base;
  }
  if (category === "Gift Set") {
    const map = {
      "signature-discovery-set": "giftset-discovery",
      "aqua-duo-gift-set": "giftset-frozenblue-oceanwater",
      "premium-attar-duo": "giftset-attar-duo",
      "signature-quad-gift-set": "giftset-signature-quad",
      "rooh-chandan-duo": "giftset-rooh-chandan-duo",
      "white-oud-and-black-oud-duo": "giftset-whiteoud-blackoud",
      "mogra-gold-and-shahi-gulab-duo": "giftset-mogragold-shahigulab",
      "royal-oud-and-shyam-shringar-duo": "giftset-royaloud-shyamshringar",
    };
    return map[base] || `giftset-${base}`;
  }
  return base;
}

function idPrefix(category) {
  if (category === "Attar") return "a-";
  if (category === "Gift Set") return "g-";
  if (category === "Collector's Edition") return "ce-";
  return "p-";
}

// Existing catalog id overrides for gift sets / known products
const ID_OVERRIDES = {
  "Gift Set|Signature Discovery Set": "g-discovery",
  "Gift Set|Aqua Duo Gift Set": "g-aqua-duo",
  "Gift Set|Premium Attar Duo": "g-attar-duo",
  "Gift Set|Signature Quad Gift Set": "g-signature-quad",
  "Gift Set|Rooh Chandan Duo": "g-rooh-chandan-duo",
  "Gift Set|White Oud & Black Oud Duo": "g-whiteoud-blackoud-duo",
  "Gift Set|Mogra Gold & Shahi Gulab Duo": "g-mogragold-shahigulab-duo",
  "Gift Set|Royal Oud & Shyam Shringar Duo": "g-royaloud-shyamshringar-duo",
  "Attar|Inayat": "a-inayat",
  "Attar|Sukoon": "a-sukoon",
  "Attar|Oud Wood": "a-oud-wood",
  "Attar|Honeymoon": "a-honeymoon",
  "Attar|Jannat Firdaus": "a-jannat-firdaus",
};

const SLUG_OVERRIDES = {
  "g-discovery": "discovery-set",
  "g-aqua-duo": "aqua-duo-gift-set",
  "g-attar-duo": "attar-duo-gift-set",
  "g-signature-quad": "signature-quad-gift-set",
  "g-rooh-chandan-duo": "rooh-chandan-duo-gift-set",
  "g-whiteoud-blackoud-duo": "whiteoud-blackoud-gift-set",
  "g-mogragold-shahigulab-duo": "mogragold-shahigulab-gift-set",
  "g-royaloud-shyamshringar-duo": "royaloud-shyamshringar-gift-set",
  "a-inayat": "inayat-attar",
  "a-sukoon": "sukoon-attar",
  "a-oud-wood": "oud-wood-attar",
  "a-honeymoon": "honeymoon-attar",
};

// ─── load existing catalog ───────────────────────────────────────────────────

function loadExistingProducts() {
  let src = fs.readFileSync(PRODUCTS_TS, "utf8");
  // Stub Vite-only bits so we can evaluate the products array
  src = src
    .replace(/const modules[\s\S]*?^};$/m, "const img = (name) => name;")
    .replace(/^export type Product[\s\S]*?^};$/m, "")
    .replace(/^export const defaultVolumes[\s\S]*?;$/m, "const defaultVolumes = ['50ml','100ml'];")
    .replace(/^export const collections[\s\S]*?^] as const;$/m, "")
    .replace(/export const products: Product\[\] =/, "const products =")
    .replace(/^export const getProduct[\s\S]*/m, "\n;products;\n");

  // Evaluate in a sandbox
  const fn = new Function(`${src}\nreturn products;`);
  const products = fn();
  if (!Array.isArray(products)) {
    throw new Error("Loaded products is not an array");
  }
  const cleaned = products.filter((p) => p && typeof p.id === "string" && typeof p.slug === "string");
  if (cleaned.length !== products.length) {
    console.warn(`Warning: dropped ${products.length - cleaned.length} invalid product entries from loaded catalog`);
  }
  return cleaned;
}

// ─── parse excel ─────────────────────────────────────────────────────────────

function parseExcel() {
  const buf = fs.readFileSync(EXCEL);
  const wb = XLSX.read(buf, { type: "buffer" });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });
  return rows.map((r, i) => ({
    row: i + 2,
    sku: String(r.SKU || "").trim(),
    title: String(r.Title || "").trim(),
    mrp: numberOrNull(r.MRP || r.__EMPTY || r.__EMPTY_1 || r.__EMPTY_2),
    price: numberOrNull(r["Selling Price"] || r.__EMPTY || r.__EMPTY_1 || r.__EMPTY_2),
    imageUrl: String(r["Images "] || r.Images || findImageUrl(r) || "").trim(),
  }));
}

function groupRows(rows) {
  const stats = {
    processed: 0,
    skipped: [],
  };
  /** @type {Map<string, any>} */
  const groups = new Map();

  for (const r of rows) {
    stats.processed++;
    if (!r.title) {
      stats.skipped.push({ row: r.row, sku: r.sku, reason: "missing product name/title" });
      continue;
    }
    if (!r.price) {
      stats.skipped.push({ row: r.row, sku: r.sku, reason: "missing price", title: r.title.slice(0, 80) });
      continue;
    }

    const category = detectCategory(r.title, r.sku);
    const name = extractName(r.title, r.sku, category);
    if (!name) {
      stats.skipped.push({ row: r.row, sku: r.sku, reason: "could not extract product name", title: r.title.slice(0, 80) });
      continue;
    }

    const volume = extractVolume(r.title, r.sku) || (category === "Attar" ? "10ml" : category === "Gift Set" ? "Gift Box" : "100ml");
    // Normalize volumes by category so attar 10ml never lands on a perfume group
    let volumeNorm = volume;
    if (category === "Attar") volumeNorm = "10ml";
    else if (category === "Gift Set") volumeNorm = "Gift Box";
    else if (category === "Perfume" && !/^\d+ml$/.test(volume)) volumeNorm = "100ml";
    else if (category === "Perfume" && volume === "10ml") volumeNorm = "100ml"; // ignore attar-sized noise

    const key = `${category}|${name.toLowerCase()}`;

    if (!groups.has(key)) {
      const overrideId = ID_OVERRIDES[`${category}|${name}`] || ID_OVERRIDES[`${category}|${displayName(name, category)}`];
      const id = overrideId || makeId(name, category);
      const slug = SLUG_OVERRIDES[id] || makeSlug(name, category);
      groups.set(key, {
        key,
        name,
        displayName: displayName(name, category),
        category,
        id,
        slug,
        imageKey: imageKey(name, category),
        gender: "Unisex",
        volumes: {},
        imageCandidates: [],
        rows: [],
      });
    }
    const g = groups.get(key);
    // Prefer higher volume's price as later overwrite for same size; keep first image candidates
    g.volumes[volumeNorm] = {
      price: r.price,
      compareAt: r.mrp || undefined,
    };
    g.imageCandidates.push({
      url: r.imageUrl,
      volume: volumeNorm,
      price: r.price,
      row: r.row,
      sku: r.sku,
    });
    g.rows.push(r);
  }

  // Finalize primary price (prefer 100ml, else Gift Box, else 10ml, else max volume)
  for (const g of groups.values()) {
    const vols = g.volumes;
    const prefer = ["100ml", "50ml", "10ml", "Gift Box", "20ml"];
    let primary = prefer.find((v) => vols[v]);
    if (!primary) primary = Object.keys(vols).sort().pop();
    g.price = vols[primary].price;
    g.compareAt = vols[primary].compareAt;
    g.primaryVolume = primary;
    g.volumeList = Object.keys(vols);

    // Prefer image from primary volume, else 100ml, else first
    const cand =
      g.imageCandidates.find((c) => c.volume === primary) ||
      g.imageCandidates.find((c) => c.volume === "100ml") ||
      g.imageCandidates[0] || null;
    g.imageUrl = cand ? cand.url : null;
    g.imageSource = cand;
  }

  return { groups: [...groups.values()], stats };
}

// ─── match existing ──────────────────────────────────────────────────────────

function normalizeMatch(s) {
  return String(s)
    .toLowerCase()
    .replace(/\s+attar$/i, "")
    .replace(/\s+perfume$/i, "")
    .replace(/\s+gift\s*set$/i, "")
    .replace(/\s+duo$/i, "")
    .replace(/[^a-z0-9]+/g, "");
}

function findExisting(existing, g) {
  // By id (strongest)
  let hit = existing.find((p) => p.id === g.id);
  if (hit) return hit;
  // By slug + category (slug alone can collide across Perfume/Attar)
  hit = existing.find((p) => p.slug === g.slug && p.category === g.category);
  if (hit) return hit;
  // By exact normalized name + category
  const want = normalizeMatch(g.displayName);
  const want2 = normalizeMatch(g.name);
  hit = existing.find((p) => {
    if (p.category !== g.category) return false;
    const n = normalizeMatch(p.name);
    return n === want || n === want2;
  });
  return hit || null;
}

// ─── write products.ts patches ───────────────────────────────────────────────

function formatPriceByVolume(vols) {
  const keys = Object.keys(vols);
  if (keys.length <= 1) return null;
  const parts = keys.map((v) => {
    const e = vols[v];
    const ca = e.compareAt != null ? `, compareAt: ${e.compareAt}` : "";
    return `"${v}": { price: ${e.price}${ca} }`;
  });
  return `{ ${parts.join(", ")} }`;
}

function volumeArray(g) {
  if (g.category === "Attar") return "ATTAR_VOL";
  if (g.category === "Gift Set") return `["Gift Box"]`;
  if (g.category === "Collector's Edition") return `["100ml"]`;
  const vols = g.volumeList.filter((v) => v.endsWith("ml")).sort((a, b) => parseInt(a) - parseInt(b));
  if (vols.length === 0) return "PERFUME_VOL";
  if (vols.includes("50ml") && vols.includes("100ml") && vols.length <= 3) return "PERFUME_VOL";
  return JSON.stringify(vols);
}

function buildNewProductBlock(g, imgName) {
  const pbv = formatPriceByVolume(g.volumes);
  const compare = g.compareAt != null ? `, compareAt: ${g.compareAt}` : "";
  const vol = volumeArray(g);
  const pbvLine = pbv ? `\n    priceByVolume: ${pbv},` : "";
  const featured =
    g.category === "Perfume" && g.primaryVolume
      ? `\n    featuredVolume: "${g.primaryVolume}",`
      : "";

  const isAttar = g.category === "Attar";
  const isGift = g.category === "Gift Set";

  return `  {
    id: "${g.id}", slug: "${g.slug}", name: "${g.displayName.replace(/"/g, '\\"')}", tagline: "Discover this fragrance",
    price: ${g.price}${compare}, category: "${g.category}", gender: "Unisex", volume: ${vol},${pbvLine}${featured}
    image: img("${imgName}"), gallery: [img("${imgName}")],
    notes: { top: ["To be updated"], heart: ["To be updated"], base: ["To be updated"] },
    longevity: "${isAttar ? "10+ hours" : isGift ? "Varies" : "8 hours"}", projection: "${isAttar ? "Intimate" : "Moderate"}",
    occasions: [${isGift ? '"Gifting", "Festive"' : '"Daily Wear", "Special Occasions"'}], moods: ["Confident"],
    ingredients: "${isAttar ? "100% alcohol-free premium attar oil." : isGift ? "Premium gift set assortment." : "Premium fragrance oils, French-grade alcohol base."}",
    description: "${g.displayName.replace(/"/g, '\\"')} — a premium Itra Wala fragrance, now available on our store.",
    rating: 4.6, reviews: 0, newArrival: true,
  }`;
}

function findProductBlockRange(src, productId) {
  const needle = `id: "${productId}"`;
  const idPos = src.indexOf(needle);
  if (idPos < 0) return null;
  // Walk backward to opening `{`
  let start = idPos;
  while (start > 0 && src[start] !== "{") start--;
  if (src[start] !== "{") return null;
  let depth = 0;
  for (let i = start; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

function replacePriceByVolume(block, pbv) {
  const marker = "priceByVolume:";
  const idx = block.indexOf(marker);
  if (idx < 0) {
    return block.replace(/category:\s*"[^"]+"/, (x) => `priceByVolume: ${pbv},\n    ${x}`);
  }
  let i = idx + marker.length;
  while (i < block.length && /\s/.test(block[i])) i++;
  if (block[i] !== "{") return block;
  const start = i;
  let depth = 0;
  for (; i < block.length; i++) {
    if (block[i] === "{") depth++;
    else if (block[i] === "}") {
      depth--;
      if (depth === 0) {
        return block.slice(0, start) + pbv + block.slice(i + 1);
      }
    }
  }
  return block;
}

function patchExistingProduct(src, existing, g, imgName) {
  const range = findProductBlockRange(src, existing.id);
  if (!range) {
    console.warn(`  ! could not locate block for ${existing.id} — will append as new`);
    return { src, ok: false };
  }

  let block = src.slice(range.start, range.end);
  block = block.replace(/price:\s*\d+/, `price: ${g.price}`);
  if (g.compareAt != null) {
    if (/compareAt:\s*\d+/.test(block)) {
      block = block.replace(/compareAt:\s*\d+/, `compareAt: ${g.compareAt}`);
    } else {
      block = block.replace(/price:\s*\d+/, (x) => `${x}, compareAt: ${g.compareAt}`);
    }
  }
  const pbv = formatPriceByVolume(g.volumes);
  if (pbv) block = replacePriceByVolume(block, pbv);
  block = block.replace(/gender:\s*"(Men|Women|Unisex)"/, 'gender: "Unisex"');
  block = block.replace(/image:\s*img\("[^"]+"\)/, `image: img("${imgName}")`);
  // Prepend imported image to gallery without wiping curated extras
  if (!block.includes(`img("${imgName}")`)) {
    block = block.replace(/gallery:\s*\[/, `gallery: [img("${imgName}"), `);
  }

  src = src.slice(0, range.start) + block + src.slice(range.end);
  return { src, ok: true };
}

function appendProducts(src, blocks) {
  if (!blocks.length) return src;
  const marker = `\n  // ─────────────── IMPORTED FROM "new price list.xlsx" ───────────────\n`;
  const insert = marker + blocks.join(",\n") + ",\n";
  // Insert before the closing `];` of products array
  const idx = src.lastIndexOf("\n];");
  if (idx < 0) throw new Error("Could not find end of products array");
  return src.slice(0, idx) + ",\n" + insert + src.slice(idx);
}

function syncPricesTs(allProducts) {
  const entries = allProducts.map((p) => {
    const compareAt = p.compareAt != null ? p.compareAt : null;
    const pbv = p.priceByVolume
      ? JSON.stringify(p.priceByVolume)
      : "null";
    return `  "${p.id}": { "price": ${p.price}, "compareAt": ${compareAt === null ? "null" : compareAt}, "priceByVolume": ${pbv} }`;
  });

  let src = fs.readFileSync(PRICES_TS, "utf8");
  const start = src.indexOf("export const PRICE_TABLE");
  const end = src.indexOf("};", start);
  if (start < 0 || end < 0) throw new Error("Could not locate PRICE_TABLE");
  const rebuilt =
    src.slice(0, start) +
    `export const PRICE_TABLE: Record<string, PriceEntry> = {\n${entries.join(",\n")},\n` +
    src.slice(end);
  fs.writeFileSync(PRICES_TS, rebuilt);
}

// ─── main ────────────────────────────────────────────────────────────────────

async function main() {
  const DRY = process.env.DRY_RUN === "1" || process.argv.includes("--dry-run");
  console.log("Reading Excel:", EXCEL);
  const rows = parseExcel();
  console.log(`Rows: ${rows.length}`);

  const { groups, stats } = groupRows(rows);
  console.log(`Grouped products: ${groups.length}`);
  console.log(`Skipped rows: ${stats.skipped.length}`);

  const existing = loadExistingProducts();
  console.log(`Existing catalog: ${existing.length}`);

  if (DRY) {
    console.log("\n── DRY RUN (no downloads / writes) ──");
    for (const g of groups) {
      const match = findExisting(existing, g);
      console.log(
        `${match ? "UPDATE" : "IMPORT"}  ${g.id.padEnd(28)} ${g.displayName.padEnd(36)} ${g.category.padEnd(20)} ₹${g.price}  vols=${Object.keys(g.volumes).join(",")}${match ? ` ← ${match.id}` : ""}`,
      );
    }
    console.log("\nSkipped:");
    for (const s of stats.skipped) console.log(` - row ${s.row} [${s.sku}]: ${s.reason}`);
    return;
  }

  const summary = {
    processed: stats.processed,
    imported: 0,
    updated: 0,
    skipped: stats.skipped.length,
    failedDownloads: 0,
    errors: [],
    products: [],
  };

  let productsSrc = fs.readFileSync(PRODUCTS_TS, "utf8");
  const newBlocks = [];
  const catalogAfter = [...existing];

  for (const g of groups) {
    const label = `${g.displayName} [${g.category}]`;
    process.stdout.write(`→ ${label} ... `);

    const dest = path.join(IMG_DIR, `${g.imageKey}.jpg`);
    const matchPreview = findExisting(catalogAfter, g);
    let imgName = g.imageKey;
    let downloaded = false;

    if (!g.imageUrl) {
      if (matchPreview && typeof matchPreview.image === "string") {
        imgName = matchPreview.image;
        downloaded = true;
        console.log(`  using existing image ${imgName}.jpg`);
      } else {
        console.log("WARN (missing image link), creating placeholder image");
        await ensurePlaceholderImage(dest);
        imgName = g.imageKey;
        downloaded = true;
      }
    } else {
      const driveId = extractDriveId(g.imageUrl);
      if (!driveId) {
        if (matchPreview && typeof matchPreview.image === "string") {
          imgName = matchPreview.image;
          downloaded = true;
          console.log(`  using existing image ${imgName}.jpg`);
        } else {
          console.log("FAIL (bad Drive URL)");
          summary.failedDownloads++;
          summary.errors.push({ product: label, error: "invalid Google Drive URL", url: g.imageUrl });
          continue;
        }
      } else {
        // Reuse existing optimized file if present and reasonably sized
        if (fs.existsSync(dest) && fs.statSync(dest).size > 8000) {
          console.log(`image cached (${g.imageKey}.jpg)`);
          downloaded = true;
        } else {
          // Prefer previously cleaned sheet-import assets when available
          const sheetImport = path.join(IMG_DIR, "sheet-import", `${g.imageKey}.jpg`);
          const sheetImportAlt = path.join(IMG_DIR, "sheet-import", `${slugify(g.name)}.jpg`);
          const localSrc = [sheetImport, sheetImportAlt].find((p) => fs.existsSync(p) && fs.statSync(p).size > 8000);
          if (localSrc) {
            const buf = fs.readFileSync(localSrc);
            await optimizeAndSave(buf, dest);
            console.log(`copied from sheet-import → ${g.imageKey}.jpg`);
            downloaded = true;
          } else {
            const result = await downloadDrive(driveId, dest);
            if (!result.ok) {
              console.log(`FAIL download: ${result.error}`);
              summary.failedDownloads++;
              summary.errors.push({ product: label, error: result.error, driveId });
              if (!fs.existsSync(dest) && matchPreview && typeof matchPreview.image === "string") {
                const existingImg = path.join(IMG_DIR, `${matchPreview.image}.jpg`);
                if (fs.existsSync(existingImg)) {
                  console.log(`  using existing image ${matchPreview.image}.jpg`);
                  imgName = matchPreview.image;
                } else {
                  continue;
                }
              } else if (!fs.existsSync(dest)) {
                continue;
              }
            } else {
              console.log(`downloaded ${g.imageKey}.jpg`);
              downloaded = true;
            }
          }
        }
      }
    }

    const match = matchPreview;
    if (match) {
      // If existing product uses a different image filename that already exists, keep updating to our new key
      // (user asked to update image). Ensure img() can resolve it.
      const patched = patchExistingProduct(productsSrc, match, g, imgName);
      if (patched.ok) {
        productsSrc = patched.src;
        // Update in-memory
        match.price = g.price;
        match.compareAt = g.compareAt;
        match.priceByVolume = Object.keys(g.volumes).length > 1 ? g.volumes : match.priceByVolume;
        match.gender = "Unisex";
        match.image = imgName;
        summary.updated++;
        summary.products.push({ action: "updated", id: match.id, name: g.displayName, price: g.price, image: imgName });
        console.log(`  updated ${match.id}`);
      } else {
        // Fall through to append with corrected id from match
        g.id = match.id;
        g.slug = match.slug;
        newBlocks.push(buildNewProductBlock(g, imgName));
        summary.imported++;
        summary.products.push({ action: "imported", id: g.id, name: g.displayName, price: g.price, image: imgName });
      }
    } else {
      // Avoid id collisions
      if (catalogAfter.some((p) => p.id === g.id)) {
        g.id = `${g.id}-new`;
      }
      if (catalogAfter.some((p) => p.slug === g.slug)) {
        g.slug = `${g.slug}-new`;
      }
      newBlocks.push(buildNewProductBlock(g, imgName));
      catalogAfter.push({
        id: g.id,
        slug: g.slug,
        name: g.displayName,
        price: g.price,
        compareAt: g.compareAt,
        category: g.category,
        gender: "Unisex",
        priceByVolume: Object.keys(g.volumes).length > 1 ? g.volumes : undefined,
        image: imgName,
      });
      summary.imported++;
      summary.products.push({ action: "imported", id: g.id, name: g.displayName, price: g.price, image: imgName });
      console.log(`  imported ${g.id}`);
    }

    void downloaded;
  }

  if (newBlocks.length) {
    // Deduplicate appends if marker already exists from a prior run
    if (productsSrc.includes('IMPORTED FROM "new price list.xlsx"')) {
      // Remove previous import block to stay idempotent
      productsSrc = productsSrc.replace(
        /,?\n  \/\/ ─────────────── IMPORTED FROM "new price list\.xlsx" ───────────────\n[\s\S]*?(?=\n\];)/,
        "",
      );
    }
    productsSrc = appendProducts(productsSrc, newBlocks);
  }

  fs.writeFileSync(PRODUCTS_TS, productsSrc);
  console.log("\nWrote", PRODUCTS_TS);

  // Reload catalog for prices sync
  const finalCatalog = loadExistingProducts();
  syncPricesTs(finalCatalog);
  console.log("Synced", PRICES_TS);

  // Persist manifest + summary
  const out = { summary, skipped: stats.skipped, groups: groups.map((g) => ({
    id: g.id, name: g.displayName, category: g.category, price: g.price, volumes: g.volumes, imageKey: g.imageKey,
  })) };
  fs.writeFileSync(MANIFEST, JSON.stringify(out, null, 2));

  console.log("\n════════ IMPORT SUMMARY ════════");
  console.log(`Total rows processed : ${summary.processed}`);
  console.log(`Successfully imported: ${summary.imported}`);
  console.log(`Updated              : ${summary.updated}`);
  console.log(`Skipped              : ${summary.skipped}`);
  console.log(`Failed downloads     : ${summary.failedDownloads}`);
  if (summary.errors.length) {
    console.log("\nErrors:");
    for (const e of summary.errors) console.log(" -", e.product, "→", e.error);
  }
  if (stats.skipped.length) {
    console.log("\nSkipped rows (first 20):");
    for (const s of stats.skipped.slice(0, 20)) {
      console.log(` - row ${s.row} [${s.sku}]: ${s.reason}`);
    }
    if (stats.skipped.length > 20) console.log(` ... and ${stats.skipped.length - 20} more`);
  }
  console.log("\nManifest:", MANIFEST);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
