import { createHash } from "crypto";
import { requireAdmin, writeAudit, allowMethods, parseBody } from "../_lib/adminAuth.js";

/**
 * Product images — attach, reorder, detach — plus Cloudinary upload signing.
 *
 * WHY SIGNED DIRECT UPLOAD
 * The browser uploads the file straight to Cloudinary and only tells us the resulting
 * URL. The file never passes through this function, which matters because Vercel caps
 * a serverless request body at ~4.5 MB — a phone photo can exceed that before it is
 * resized. Signing keeps the API secret server-side while letting the upload itself go
 * direct.
 *
 * Delivery transforms (f_auto, q_auto, width) are applied at read time by
 * resolveImageSized() in src/lib/imageSource.ts, so the original stays untouched and
 * sizing decisions can change later without re-uploading anything.
 *
 * Two image sources coexist: 'repo' rows point at the 851 photos already committed
 * under src/assets/ (served free from Vercel's CDN); 'cloudinary' rows are uploads.
 * See src/lib/imageSource.ts for how each resolves.
 */

const CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME || "";
const API_KEY = process.env.CLOUDINARY_API_KEY || "";
const API_SECRET = process.env.CLOUDINARY_API_SECRET || "";
const UPLOAD_FOLDER = process.env.CLOUDINARY_FOLDER || "products";

const isCloudinaryConfigured = () => Boolean(CLOUD_NAME && API_KEY && API_SECRET);

/** Cloudinary signs the alphabetically-sorted `k=v` params joined by `&`, with the
 *  API secret appended — not an HMAC. Getting the ordering wrong yields a signature
 *  Cloudinary rejects with a generic error, so it is built explicitly here. */
function signParams(params: Record<string, string | number>): string {
  const toSign = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(toSign + API_SECRET).digest("hex");
}

const SOURCES = new Set(["repo", "cloudinary"]);

export default async function handler(req: any, res: any) {
  if (!allowMethods(req, res, ["GET", "POST", "PATCH", "DELETE"])) return;

  const ctx = await requireAdmin(req, res);
  if (!ctx) return;

  const { admin } = ctx;
  const body = parseBody(req.body);
  const action = String(req.query?.action || body.action || "");

  try {
    /* ── upload signature ─────────────────────────────────────────────────── */
    if (req.method === "POST" && action === "sign") {
      if (!isCloudinaryConfigured()) {
        res.status(503).json({
          error:
            "Cloudinary is not configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET.",
        });
        return;
      }

      const timestamp = Math.floor(Date.now() / 1000);

      // Everything here is covered by the signature, so the browser cannot widen it:
      // Cloudinary rejects the upload if any signed parameter is altered in transit.
      //
      //   allowed_formats — without this, an admin token (or a stolen one) could push
      //                     arbitrary files through an endpoint labelled "image upload"
      //                     and get them served from a domain we allow in our CSP.
      //   transformation  — normalises on arrival to at most 2000px and strips EXIF,
      //                     which also removes GPS coordinates from phone photos.
      const params: Record<string, string | number> = {
        allowed_formats: "jpg,jpeg,png,webp,avif",
        folder: UPLOAD_FOLDER,
        timestamp,
        transformation: "c_limit,w_2000,h_2000,q_auto",
      };
      const signature = signParams(params);

      res.status(200).json({
        cloudName: CLOUD_NAME,
        apiKey: API_KEY,
        timestamp,
        folder: UPLOAD_FOLDER,
        allowedFormats: params.allowed_formats,
        transformation: params.transformation,
        signature,
        // Pinned to the image endpoint — /raw/upload or /video/upload would accept
        // things this signature is not meant to authorise.
        uploadUrl: `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
      });
      return;
    }

    /* ── list images for a product ────────────────────────────────────────── */
    if (req.method === "GET") {
      const productId = String(req.query?.product_id || "").trim();
      let q = admin.from("product_images").select("*").order("position");
      if (productId) q = q.eq("product_id", productId);

      const { data, error } = await q;
      if (error) throw error;
      res.status(200).json({ images: data });
      return;
    }

    /* ── attach an image to a product ─────────────────────────────────────── */
    if (req.method === "POST") {
      const productId = String(body.product_id || "").trim();
      const source = String(body.source || "").trim();

      if (!productId) {
        res.status(400).json({ error: "product_id is required" });
        return;
      }
      if (!SOURCES.has(source)) {
        res.status(400).json({ error: 'source must be "repo" or "cloudinary"' });
        return;
      }

      const storageKey = source === "repo" ? String(body.storage_key || "").trim() : null;
      const url = source === "cloudinary" ? String(body.url || "").trim() : null;

      if (source === "repo" && !storageKey) {
        res.status(400).json({ error: 'storage_key is required when source is "repo"' });
        return;
      }
      if (source === "cloudinary" && !url) {
        res.status(400).json({ error: 'url is required when source is "cloudinary"' });
        return;
      }

      // Confirm the product exists first: the FK would reject this anyway, but with a
      // Postgres error rather than something the admin UI can show.
      const { data: product } = await admin
        .from("products").select("id").eq("id", productId).maybeSingle();
      if (!product) {
        res.status(404).json({ error: "Product not found" });
        return;
      }

      // null volume = the general gallery; a value scopes the photo to one size.
      const volume = body.volume ? String(body.volume).trim() : null;

      const { data: last } = await admin
        .from("product_images")
        .select("position")
        .eq("product_id", productId)
        .order("position", { ascending: false })
        .limit(1)
        .maybeSingle();

      const { data, error } = await admin
        .from("product_images")
        .insert({
          product_id: productId,
          volume,
          source,
          storage_key: storageKey,
          url,
          alt: body.alt ? String(body.alt) : null,
          position: body.position ?? ((last?.position as number) ?? -1) + 1,
        })
        .select()
        .single();
      if (error) throw error;

      await writeAudit(ctx, {
        action: "create",
        entity: "product_image",
        entityId: data.id,
        after: data,
      });
      res.status(201).json({ image: data });
      return;
    }

    /* ── reorder / edit ───────────────────────────────────────────────────── */
    if (req.method === "PATCH") {
      // Gallery order decides which photo leads a product card, so it is sent as one
      // batch — a partial reorder would leave the wrong image as the hero.
      if (Array.isArray(body.order)) {
        const updates = body.order
          .filter((o: any) => o && o.id)
          .map((o: any) => ({ id: String(o.id), position: Number(o.position) || 0 }));

        for (const u of updates) {
          const { error } = await admin
            .from("product_images").update({ position: u.position }).eq("id", u.id);
          if (error) throw error;
        }

        await writeAudit(ctx, { action: "reorder", entity: "product_image", after: updates });
        res.status(200).json({ ok: true, reordered: updates.length });
        return;
      }

      const id = String(body.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      const fields: Record<string, any> = {};
      if (body.alt !== undefined) fields.alt = body.alt ? String(body.alt) : null;
      if (body.volume !== undefined) fields.volume = body.volume ? String(body.volume) : null;
      if (body.position !== undefined) fields.position = Number(body.position) || 0;

      if (!Object.keys(fields).length) {
        res.status(400).json({ error: "No writable fields supplied" });
        return;
      }

      const { data, error } = await admin
        .from("product_images").update(fields).eq("id", id).select().single();
      if (error) throw error;

      res.status(200).json({ image: data });
      return;
    }

    /* ── detach ───────────────────────────────────────────────────────────── */
    if (req.method === "DELETE") {
      const id = String(body.id || req.query?.id || "").trim();
      if (!id) {
        res.status(400).json({ error: "id is required" });
        return;
      }

      const { data: before } = await admin
        .from("product_images").select("*").eq("id", id).maybeSingle();
      if (!before) {
        res.status(404).json({ error: "Image not found" });
        return;
      }

      const { error } = await admin.from("product_images").delete().eq("id", id);
      if (error) throw error;

      // Only the database row goes. The Cloudinary asset and the repo file are both
      // left in place: the same image may be attached to another product, and a
      // detach that silently destroyed the original would be unrecoverable.
      await writeAudit(ctx, {
        action: "delete",
        entity: "product_image",
        entityId: id,
        before,
      });
      res.status(200).json({ ok: true });
      return;
    }
  } catch (err: any) {
    console.error("api/admin/images", req.method, action, err?.message || err);
    res.status(500).json({ error: "Request failed. Check server logs." });
  }
}
