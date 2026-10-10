import type { Plugin } from "vite";
import sharp from "sharp";

// Product photos stay as .jpg/.png in the repo (the database references them by their
// source path, so renaming files would orphan those references). At build time every
// emitted product image is re-encoded to WebP and its output name/URL rewritten, so
// shoppers get the smaller file with zero changes to code or data.
const PRODUCT_DIRS = /(^|\/)src\/assets\/(products|Product Gallery|new Product Gallery|product-gallery-2|product-gallery-3|Pack of 4 and 8|Divine Series)\//;

export function webpProductImages(): Plugin {
  return {
    name: "webp-product-images",
    apply: "build",
    async generateBundle(_, bundle) {
      const renames = new Map<string, string>();
      await Promise.all(
        Object.values(bundle).map(async (f) => {
          if (f.type !== "asset" || !/\.(jpe?g|png)$/i.test(f.fileName)) return;
          const src = (f.originalFileNames ?? []).map((p) => p.split("\\").join("/"));
          if (!src.some((p) => PRODUCT_DIRS.test(p))) return;
          const input = typeof f.source === "string" ? Buffer.from(f.source) : Buffer.from(f.source);
          const out = await sharp(input).webp({ quality: 80 }).toBuffer();
          if (out.length >= input.length) return;
          const oldName = f.fileName;
          const newName = oldName.replace(/\.(jpe?g|png)$/i, ".webp");
          renames.set(oldName, newName);
          // Names containing spaces appear URL-encoded inside the emitted code.
          renames.set(encodeURI(oldName), encodeURI(newName));
          f.source = out;
          f.fileName = newName;
        })
      );
      if (!renames.size) return;
      for (const f of Object.values(bundle)) {
        if (f.type === "chunk") {
          let code = f.code;
          for (const [a, b] of renames) code = code.split(a).join(b);
          f.code = code;
        } else if (typeof f.source === "string" && /\.(css|html)$/.test(f.fileName)) {
          let s = f.source;
          for (const [a, b] of renames) s = s.split(a).join(b);
          f.source = s;
        }
      }
    },
  };
}
