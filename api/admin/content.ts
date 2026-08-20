import { requireAdmin, writeAudit, allowMethods, parseBody } from "../_lib/adminAuth.js";

/**
 * Site content CRUD — hero banners, the announcement bar, collection tiles, and
 * key/value site settings.
 *
 * Four resources share one endpoint (?resource=banners|announcements|collections|settings)
 * rather than getting a file each, because Vercel's Hobby plan caps a project at 12
 * serverless functions and this repo is already at nine. Splitting them later is a
 * mechanical change if that ceiling moves.
 *
 * Admin-gated by requireAdmin(). Runs with the service role key, so RLS is bypassed
 * by design and that check is the only gate.
 */

type ResourceName = "banners" | "announcements" | "collections" | "settings";

/** Per-resource whitelist of writable columns. Anything else in the payload is
 *  dropped, so a hostile request can't reach id/created_at/updated_at. */
const WRITABLE: Record<Exclude<ResourceName, "settings">, Set<string>> = {
  banners: new Set([
    "source", "storage_key", "url",
    "mobile_source", "mobile_storage_key", "mobile_url", "mobile_fit",
    "eyebrow", "headline", "subtext", "cta_label", "cta_href",
    "position", "active",
  ]),
  announcements: new Set(["text", "position", "active"]),
  collections: new Set([
    "key", "title", "blurb", "sub",
    "source", "storage_key", "url",
    "position", "active",
  ]),
};

const SOURCES = new Set(["repo", "cloudinary"]);

const pick = (body: Record<string, any>, allowed: Set<string>) =>
  Object.fromEntries(Object.entries(body).filter(([k]) => allowed.has(k)));

/**
 * An image reference is only usable if the locator matching its source is present —
 * the same rule the product_images CHECK constraint enforces. Validating here too
 * turns a 500 from Postgres into a readable 400 for the admin.
 */
function validateImageRef(
  fields: Record<string, any>,
  sourceKey: string,
  keyKey: string,
  urlKey: string,
  errors: string[],
  { required }: { required: boolean }
) {
  const source = fields[sourceKey];
  if (source === undefined || source === null || source === "") {
    if (required) errors.push(`${sourceKey} is required`);
    return;
  }
  if (!SOURCES.has(String(source))) {
    errors.push(`${sourceKey} must be "repo" or "cloudinary"`);
    return;
  }
  if (source === "repo" && !String(fields[keyKey] ?? "").trim()) {
    errors.push(`${keyKey} is required when ${sourceKey} is "repo"`);
  }
  if (source === "cloudinary" && !String(fields[urlKey] ?? "").trim()) {
    errors.push(`${urlKey} is required when ${sourceKey} is "cloudinary"`);
  }
}

function validate(resource: ResourceName, fields: Record<string, any>, partial: boolean): string[] {
  const errors: string[] = [];

  if (resource === "banners") {
    validateImageRef(fields, "source", "storage_key", "url", errors, { required: !partial });
    // The mobile image is optional throughout — it falls back to the desktop art —
    // but if a source is given it still needs its locator.
    if (fields.mobile_source) {
      validateImageRef(fields, "mobile_source", "mobile_storage_key", "mobile_url", errors, { required: false });
    }
    if (fields.mobile_fit !== undefined && !["cover", "contain"].includes(String(fields.mobile_fit))) {
      errors.push('mobile_fit must be "cover" or "contain"');
    }
    // A CTA with a label but no destination renders a dead button.
    if (String(fields.cta_label ?? "").trim() && !String(fields.cta_href ?? "").trim()) {
      errors.push("cta_href is required when cta_label is set");
    }
  }

  if (resource === "announcements") {
    if (!partial || fields.text !== undefined) {
      if (!String(fields.text ?? "").trim()) errors.push("text is required");
    }
  }

  if (resource === "collections") {
    if (!partial && !String(fields.key ?? "").trim()) errors.push("key is required");
    if (!partial && !String(fields.title ?? "").trim()) errors.push("title is required");
    if (fields.sub !== undefined && !Array.isArray(fields.sub)) errors.push("sub must be an array");
    if (fields.source) {
      validateImageRef(fields, "source", "storage_key", "url", errors, { required: false });
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
  const resource = String(req.query?.resource || body.resource || "") as ResourceName;

  if (!["banners", "announcements", "collections", "settings"].includes(resource)) {
    res.status(400).json({ error: "resource must be banners, announcements, collections or settings" });
    return;
  }

  try {
    /* ── settings: key/value, upsert-only ─────────────────────────────────── */
    // Modelled as key/value so a new setting never needs a migration. There is no
    // create/delete distinction — writing a key either inserts or replaces it.
    if (resource === "settings") {
      if (req.method === "GET") {
        const { data, error } = await admin.from("site_settings").select("*").order("key");
        if (error) throw error;
        res.status(200).json({ settings: data });
        return;
      }

      if (req.method === "POST" || req.method === "PATCH") {
        const key = String(body.key || "").trim();
        if (!key) {
          res.status(400).json({ error: "key is required" });
          return;
        }
        if (body.value === undefined) {
          res.status(400).json({ error: "value is required" });
          return;
        }

        const { data: before } = await admin
          .from("site_settings").select("*").eq("key", key).maybeSingle();

        const { data, error } = await admin
          .from("site_settings")
          .upsert({ key, value: body.value, updated_at: new Date().toISOString() })
          .select()
          .single();
        if (error) throw error;

        await writeAudit(ctx, {
          action: before ? "update" : "create",
          entity: "setting",
          entityId: key,
          before,
          after: data,
        });
        res.status(200).json({ setting: data });
        return;
      }

      if (req.method === "DELETE") {
        const key = String(body.key || req.query?.key || "").trim();
        if (!key) {
          res.status(400).json({ error: "key is required" });
          return;
        }
        const { data: before } = await admin
          .from("site_settings").select("*").eq("key", key).maybeSingle();
        const { error } = await admin.from("site_settings").delete().eq("key", key);
        if (error) throw error;

        await writeAudit(ctx, { action: "delete", entity: "setting", entityId: key, before });
        res.status(200).json({ ok: true });
        return;
      }
    }

    /* ── banners / announcements / collections ────────────────────────────── */
    const table = resource;
    const allowed = WRITABLE[resource as Exclude<ResourceName, "settings">];

    if (req.method === "GET") {
      // Unlike the storefront, the admin sees inactive rows too — otherwise a
      // switched-off banner would be invisible and unrecoverable.
      const { data, error } = await admin.from(table).select("*").order("position");
      if (error) throw error;
      res.status(200).json({ [table]: data });
      return;
    }

    if (req.method === "POST") {
      const fields = pick(body, allowed);
      const errors = validate(resource, fields, false);
      if (errors.length) {
        res.status(400).json({ error: errors.join("; ") });
        return;
      }

      // New rows land at the end of the list unless told otherwise.
      if (fields.position === undefined) {
        const { data: last } = await admin
          .from(table).select("position").order("position", { ascending: false }).limit(1).maybeSingle();
        fields.position = ((last?.position as number) ?? -1) + 1;
      }

      const { data, error } = await admin.from(table).insert(fields).select().single();
      if (error) {
        if ((error as any).code === "23505") {
          res.status(409).json({ error: "That key already exists." });
          return;
        }
        throw error;
      }

      await writeAudit(ctx, { action: "create", entity: resource, entityId: data.id, after: data });
      res.status(201).json({ [resource]: data });
      return;
    }

    if (req.method === "PATCH") {
      // Reorder is a batch of {id, position} rather than N round trips, so dragging
      // a row can't leave the list half-renumbered if one request fails.
      if (Array.isArray(body.order)) {
        const updates = body.order
          .filter((o: any) => o && o.id !== undefined)
          .map((o: any) => ({ id: String(o.id), position: Number(o.position) || 0 }));

        for (const u of updates) {
          const { error } = await admin.from(table).update({ position: u.position }).eq("id", u.id);
          if (error) throw error;
        }
        await writeAudit(ctx, { action: "reorder", entity: resource, after: updates });
        res.status(200).json({ ok: true, reordered: updates.length });
        return;
      }

      const id = String(body.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      const fields = pick(body, allowed);
      if (!Object.keys(fields).length) {
        res.status(400).json({ error: "No writable fields supplied" });
        return;
      }

      const errors = validate(resource, fields, true);
      if (errors.length) {
        res.status(400).json({ error: errors.join("; ") });
        return;
      }

      const { data: before } = await admin.from(table).select("*").eq("id", id).maybeSingle();
      if (!before) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const { data, error } = await admin.from(table).update(fields).eq("id", id).select().single();
      if (error) throw error;

      await writeAudit(ctx, { action: "update", entity: resource, entityId: id, before, after: data });
      res.status(200).json({ [resource]: data });
      return;
    }

    if (req.method === "DELETE") {
      const id = String(body.id || req.query?.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      // These are pure presentation rows with nothing referencing them, so unlike
      // products they are safe to remove outright.
      const { data: before } = await admin.from(table).select("*").eq("id", id).maybeSingle();
      if (!before) {
        res.status(404).json({ error: "Not found" });
        return;
      }

      const { error } = await admin.from(table).delete().eq("id", id);
      if (error) throw error;

      await writeAudit(ctx, { action: "delete", entity: resource, entityId: id, before });
      res.status(200).json({ ok: true });
      return;
    }
  } catch (err: any) {
    console.error("api/admin/content", resource, req.method, err?.message || err);
    res.status(500).json({ error: "Request failed. Check server logs." });
  }
}
