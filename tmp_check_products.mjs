import fs from 'fs';
const txt = fs.readFileSync('src/data/products.ts', 'utf8');
const lineMatches = [];
const lines = txt.split(/\r?\n/);
lines.forEach((line, idx) => {
  if (line.includes('},,')) lineMatches.push({ idx: idx + 1, line });
});
const ids = [];
const slugs = [];
const idRegex = /id:\s*"([^\"]+)"/g;
const slugRegex = /slug:\s*"([^\"]+)"/g;
let m;
while ((m = idRegex.exec(txt)) !== null) ids.push(m[1]);
while ((m = slugRegex.exec(txt)) !== null) slugs.push(m[1]);
const dup = (arr) => arr.reduce((acc, v, i, a) => {
  if (a.indexOf(v) !== i && !acc.includes(v)) acc.push(v);
  return acc;
}, []);
const dupsId = dup(ids);
const dupsSlug = dup(slugs);
console.log(JSON.stringify({ lineMatches, idCount: ids.length, slugCount: slugs.length, duplicateIds: dupsId, duplicateSlugs: dupsSlug }, null, 2));
