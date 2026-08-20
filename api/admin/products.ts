import { requireAdmin, writeAudit, allowMethods, parseBody } from "../_lib/adminAuth.js";

/**
 * Catalogue CRUD — GET (list) / POST (create) / PATCH (update) / DELETE (archive).
 *
 * Every branch is admin-gated by requireAdmin(). These handlers run with the service
 * role key, so RLS does not protect them; that check is the only thing standing
 * between this endpoint and someone repricing the store.
 *
 * DELETE archives rather than removes. A hard delete would break the product's URL,
 * kill any live ad pointing at it, and orphan the line items in orders that reference
 * the id. Archived products disappear from the storefront (the public RLS policy
 * filters on archived = false) but stay intact for history.
 */

/** Columns a client may write. Anything else in the payload is ignored rather than
 *  rejected, so adding a UI field can't accidentally write a column that doesn't
 *  exist — and a hostile payload can't touch id, created_at, or updated_at. */
const WRITABLE = new Set([
  "slug", "name", "tagline", "description", "ingredients",
  "category", "gender",
  "price", "compare_at", "price_by_volume",
  "volumes", "featured_volume", "variant_label", "content_by_volume",
  "notes", "longevity", "projection", "occasions", "moods",
  "rating", "reviews_count",
  "badge", "best_seller", "new_arrival", "trending",
  "amazon_choice", "amazon_url", "video_url",
  "archived", "position",
]);

const CATEGORIES = new Set(["Perfume", "Attar", "Gift Set", "Collector's Edition"]);
const GENDERS = new Set(["Men", "Women", "Unisex"]);

const pick = (body: Record<string, any>) =>
  Object.fromEntries(Object.entries(body).filter(([k]) => WRITABLE.has(k)));

/** Money must be a finite, non-negative number. Strings that look numeric are
 *  accepted (form inputs are strings) but anything else is rejected outright rather
 *  than coerced — Number("") is 0, which would silently make a product free. */
function normaliseMoney(value: unknown, field: string, errors: string[]): number | null | undefined {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).trim());
  if (!Number.isFinite(n) || n < 0) {
    errors.push(`${field} must be a number of 0 or more`);
    return undefined;
  }
  return Math.round(n * 100) / 100;
}

/** Shared validation for create and update. `partial` skips required-field checks so
 *  a PATCH can send one field without resupplying the whole product. */
function validate(fields: Record<string, any>, partial: boolean): string[] {
  const errors: string[] = [];

  if (!partial) {
    for (const required of ["slug", "name", "category"]) {
      if (!String(fields[required] ?? "").trim()) errors.push(`${required} is required`);
    }
    if (fields.price === undefined || fields.price === null || fields.price === "") {
      errors.push("price is required");
    }
  }

  if (fields.slug !== undefined && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(String(fields.slug))) {
    errors.push("slug must be lowercase letters, numbers and single hyphens");
  }
  if (fields.category !== undefined && !CATEGORIES.has(String(fields.category))) {
    errors.push(`category must be one of: ${[...CATEGORIES].join(", ")}`);
  }
  if (fields.gender !== undefined && !GENDERS.has(String(fields.gender))) {
    errors.push(`gender must be one of: ${[...GENDERS].join(", ")}`);
  }
  if (fields.rating !== undefined && fields.rating !== null) {
    const r = Number(fields.rating);
    if (!Number.isFinite(r) || r < 0 || r > 5) errors.push("rating must be between 0 and 5");
  }

  const price = normaliseMoney(fields.price, "price", errors);
  if (price !== undefined) fields.price = price;
  const compare = normaliseMoney(fields.compare_at, "compare_at", errors);
  if (compare !== undefined) fields.compare_at = compare;

  // Per-size prices are what checkout actually charges for a selected size, so they
  // get the same scrutiny as the headline price rather than being trusted as jsonb.
  if (fields.price_by_volume !== undefined && fields.price_by_volume !== null) {
    const pbv = fields.price_by_volume;
    if (typeof pbv !== "object" || Array.isArray(pbv)) {
      errors.push("price_by_volume must be an object keyed by size");
    } else {
      for (const [size, entry] of Object.entries(pbv as Record<string, any>)) {
        if (!entry || typeof entry !== "object") {
          errors.push(`price_by_volume.${size} must be an object`);
          continue;
        }
        const p = normaliseMoney(entry.price, `price_by_volume.${size}.price`, errors);
        if (p === undefined || p === null) {
          errors.push(`price_by_volume.${size}.price is required`);
        } else {
          entry.price = p;
        }
        const c = normaliseMoney(entry.compareAt, `price_by_volume.${size}.compareAt`, errors);
        if (c === undefined) delete entry.compareAt;
        else if (c === null) delete entry.compareAt;
        else entry.compareAt = c;
      }
    }
  }

  return errors;
}

export default async function handler(req: any, res: any) {
  if (!allowMethods(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;

  const { admin } = ctx;
  const body = parseBody(req.body);

  try {
    /* ── list ─────────────────────────────────────────────────────────────── */
    if (req.method === "GET") {
      // Includes archived rows: the admin needs to see and restore them, unlike the
      // storefront which never should.
      const [products, images] = await Promise.all([
        admin.from("products").select("*").order("position").order("name"),
        admin.from("product_images").select("*").order("position"),
      ]);
      if (products.error) throw products.error;
      if (images.error) throw images.error;
      res.status(200).json({ products: products.data, images: images.data });
      return;
    }

    /* ── create ───────────────────────────────────────────────────────────── */
    if (req.method === "POST") {
      const fields = pick(body);
      const errors = validate(fields, false);
      if (errors.length) {
        res.status(400).json({ error: errors.join("; ") });
        return;
      }

      // Ids are human-readable and stable ("p-celebrity"); they're referenced by
      // offer rules and analytics, so they're derived once from the slug and never
      // regenerated afterwards.
      const prefix =
        fields.category === "Attar" ? "a"
        : fields.category === "Gift Set" ? "g"
        : fields.category === "Collector's Edition" ? "ce"
        : "p";
      const id = String(body.id || `${prefix}-${fields.slug}`).trim();

      const { data, error } = await admin
        .from("products")
        .insert({ id, ...fields })
        .select()
        .single();

      if (error) {
        // 23505 = unique_violation, i.e. this slug or id already exists.
        if ((error as any).code === "23505") {
          res.status(409).json({ error: "A product with that slug already exists." });
          return;
        }
        throw error;
      }

      await writeAudit(ctx, { action: "create", entity: "product", entityId: id, after: data });
      res.status(201).json({ product: data });
      return;
    }

    /* ── update ───────────────────────────────────────────────────────────── */
    if (req.method === "PATCH") {
      const id = String(body.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      const fields = pick(body);
      if (!Object.keys(fields).length) {
        res.status(400).json({ error: "No writable fields supplied" });
        return;
      }

      const errors = validate(fields, true);
      if (errors.length) {
        res.status(400).json({ error: errors.join("; ") });
        return;
      }

      // Read-before-write so the audit row can show what actually changed. Without
      // the `before` snapshot the log says a price changed but not from what.
      const { data: before } = await admin.from("products").select("*").eq("id", id).maybeSingle();
      if (!before) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const { data, error } = await admin
        .from("products")
        .update(fields)
        .eq("id", id)
        .select()
        .single();

      if (error) {
        if ((error as any).code === "23505") {
          res.status(409).json({ error: "That slug is already in use." });
          return;
        }
        throw error;
      }

      await writeAudit(ctx, { action: "update", entity: "product", entityId: id, before, after: data });
      res.status(200).json({ product: data });
      return;
    }

    /* ── archive / restore ────────────────────────────────────────────────── */
    if (req.method === "DELETE") {
      const id = String(body.id || req.query?.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }
      const restore = body.restore === true || req.query?.restore === "true";

      const { data: before } = await admin.from("products").select("*").eq("id", id).maybeSingle();
      if (!before) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      const { data, error } = await admin
        .from("products")
        .update({ archived: !restore })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;

      await writeAudit(ctx, {
        action: restore ? "update" : "delete",
        entity: "product",
        entityId: id,
        before,
        after: data,
      });
      res.status(200).json({ product: data, archived: !restore });
      return;
    }
  } catch (err: any) {
    console.error("api/admin/products", req.method, err?.message || err);
    res.status(500).json({ error: "Request failed. Check server logs." });
  }
}
