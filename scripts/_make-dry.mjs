import { createRequire } from "module";
// Re-use parse/group by dynamically importing after a small refactor is heavy;
// instead, spawn the grouping by evaluating a copy of the helpers via child process.
import { spawnSync } from "child_process";
import fs from "fs";

// Quick: run import with DOWNLOAD_SKIP by patching env — or just import functions.
// We'll inline a dry-run by reading the script's parse after extracting.

const code = `
import XLSX from "xlsx";
import fs from "fs";
${fs.readFileSync("scripts/import-products.mjs", "utf8")
  .replace(/^async function main[\s\S]*/m, "")
  .replace(/^await optimizeAndSave[\s\S]*?^}/m, "")
  // keep helpers
}

const rows = parseExcel();
const { groups, stats } = groupRows(rows);
const existing = loadExistingProducts();
console.log(JSON.stringify({
  groups: groups.length,
  skipped: stats.skipped.length,
  sample: groups.slice(0, 5).map(g => ({ id: g.id, name: g.displayName, cat: g.category, price: g.price, vols: g.volumes })),
  all: groups.map(g => {
    const match = findExisting(existing, g);
    return { id: g.id, name: g.displayName, cat: g.category, price: g.price, vols: Object.keys(g.volumes), match: match ? match.id : null };
  }),
  skipped: stats.skipped.slice(0, 15),
}, null, 2));
`;

fs.writeFileSync("scripts/_dry-run.mjs", code);
