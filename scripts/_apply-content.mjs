import fs from "fs";
const g = JSON.parse(fs.readFileSync("tmp_content/grouped.json", "utf8"));
const split = s => (s ? String(s).split(",").map(x => x.trim()).filter(Boolean) : []);
const content = {};
for (const [id, rs] of Object.entries(g)) {
  const cnt = r => ["Top Notes", "Heart Notes", "Base Notes"].reduce((n, k) => n + split(r[k]).length, 0);
  const best = [...rs].sort((a, b) => cnt(b) - cnt(a))[0];
  const hrs = Math.max(...rs.map(r => parseInt(r["Longevity Hours"]) || 0));
  const paras = String(best["Long Description"]).split(/\r?\n\s*\r?\n/);
  const clean = p => p.replace(/\s*\(\d+(\s*x\s*\d+)?\s*ml\)/g, "").replace(/\s+\d+\s*ml\b/g, "");
  const intro = clean(paras[0]).replace(/\ba up to/g, "an up to");
  const notes = paras.find(p => p.startsWith("Fragrance notes:"));
  const longev = (paras.find(p => p.startsWith("Longevity:")) || "").split(". ").filter(s => !/bottle|travel-size/i.test(s));
  const care = longev.slice(1).join(". ");
  const longevity = `Up to ${hrs} hours`;
  const desc = [intro, notes && notes.replace("Fragrance notes: it", "Fragrance notes: it"), `Longevity: up to ${hrs} hours of long-lasting wear.${care ? " " + care.replace(/\.?$/, ".") : ""}`].filter(Boolean).join(" ");
  content[id] = {
    description: desc,
    notes: { top: split(best["Top Notes"]), heart: split(best["Heart Notes"]), base: split(best["Base Notes"]) },
    longevity,
    ingredients: best["Ingredients"],
    keywords: [...new Set(rs.flatMap(r => split(r["Keywords"])))],
  };
}
// Attars carry no notes in the sheet: keep the site's existing notes.
for (const c of Object.values(content)) if (!c.notes.top.length && !c.notes.heart.length && !c.notes.base.length) delete c.notes;
const ts = `// Generated from ITRAWALA_Website_Product_Upload2.xlsx by scripts/_apply-content.mjs.
// Overrides description / notes / longevity / ingredients on matching products (keyed by id)
// and attaches SEO keywords. Applied at the bottom of products.ts.
export const productContent: Record<string, {
  description: string;
  notes?: { top: string[]; heart: string[]; base: string[] };
  longevity: string;
  ingredients: string;
  keywords: string[];
}> = ${JSON.stringify(content, null, 2)};
`;
fs.writeFileSync("src/data/productContent.ts", ts);
console.log(Object.keys(content).length, content["p-million"].description, "\n", content["a-celebrity"].description);
