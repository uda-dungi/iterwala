import type { Plugin } from "vite";
import ts from "typescript";

// src/data/products.ts holds the whole catalogue (~135KB of source) and stays that way:
// scripts/seed-catalog.mjs and scripts/import-products.mjs read it as the source of truth.
// But the storefront fetches the live catalogue from Supabase, so the bundle only needs a
// small snapshot to paint the first frame (and to serve if the database is slow or down).
// At bundle time this plugin trims the exported `products` array to the best sellers
// below, and swaps `snapshotVideoBySlug` for a literal built from the FULL list — the
// product clips are repo assets with no database column, so they must still be attached
// to live rows for products that are no longer in the snapshot.
const FALLBACK_SLUGS = new Set([
  "celebrity", "inayat-attar", "touch", "million", "royal-oud", "zannat",
  "rooh-chandan", "shahi-gulab", "jannat-firdaus", "mogra-gold",
  "pack-of-4-gift-set", "discovery-set",
]);

const slugOf = (el: ts.ObjectLiteralExpression): string | undefined => {
  for (const p of el.properties) {
    if (ts.isPropertyAssignment(p) && p.name.getText() === "slug" && ts.isStringLiteralLike(p.initializer)) {
      return p.initializer.text;
    }
  }
  return undefined;
};

export function trimCatalogSnapshot(): Plugin {
  return {
    name: "trim-catalog-snapshot",
    enforce: "pre",
    transform(code, id) {
      if (!/[\/]src[\/]data[\/]products\.ts$/.test(id)) return null;
      const sf = ts.createSourceFile(id, code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
      let arrayNode: ts.ArrayLiteralExpression | undefined;
      let videoStmt: ts.VariableStatement | undefined;
      for (const st of sf.statements) {
        if (!ts.isVariableStatement(st)) continue;
        for (const d of st.declarationList.declarations) {
          const name = d.name.getText();
          if (name === "products" && d.initializer && ts.isArrayLiteralExpression(d.initializer)) arrayNode = d.initializer;
          if (name === "snapshotVideoBySlug") videoStmt = st;
        }
      }
      if (!arrayNode || !videoStmt) throw new Error("trim-catalog-snapshot: products / snapshotVideoBySlug not found in products.ts");

      const kept: string[] = [];
      const videos: string[] = [];
      const seen = new Set<string>();
      for (const el of arrayNode.elements) {
        if (!ts.isObjectLiteralExpression(el)) continue;
        const slug = slugOf(el);
        if (!slug) continue;
        for (const p of el.properties) {
          if (ts.isPropertyAssignment(p) && p.name.getText() === "video") {
            videos.push(`${JSON.stringify(slug)}: ${p.initializer.getText()}`);
          }
        }
        if (FALLBACK_SLUGS.has(slug)) { kept.push(el.getText()); seen.add(slug); }
      }
      const missing = [...FALLBACK_SLUGS].filter((s) => !seen.has(s));
      if (missing.length) throw new Error(`trim-catalog-snapshot: fallback slugs not in products.ts: ${missing.join(", ")}`);

      const edits: { start: number; end: number; text: string }[] = [
        { start: arrayNode.getStart(), end: arrayNode.getEnd(), text: `[\n${kept.join(",\n")},\n]` },
        {
          start: videoStmt.getStart(),
          end: videoStmt.getEnd(),
          text: `export const snapshotVideoBySlug: Record<string, string | undefined> = {\n${videos.join(",\n")},\n};`,
        },
      ].sort((a, b) => b.start - a.start);
      let out = code;
      for (const e of edits) out = out.slice(0, e.start) + e.text + out.slice(e.end);
      return { code: out, map: null };
    },
  };
}
