/**
 * Typed client for /api/admin/*.
 *
 * Every call attaches the caller's Supabase access token. The server re-verifies that
 * token and re-checks the admin allowlist on each request (api/_lib/adminAuth.ts) — the
 * UI hiding a button is convenience, never protection.
 */

import { supabase } from "@/lib/supabase";

async function authHeaders(): Promise<Record<string, string>> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: { session: null } };
  const token = data?.session?.access_token;
  if (!token) throw new Error("Not signed in");
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function request<T>(url: string, init: RequestInit = {}): Promise<T> {
  const headers = await authHeaders();
  const res = await fetch(url, { ...init, headers: { ...headers, ...(init.headers ?? {}) } });

  // Surface the server's own message where there is one — validation errors say
  // exactly which field is wrong, and swallowing that would make them undebuggable.
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* non-JSON error body — keep the status message */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

/* ── products ──────────────────────────────────────────────────────────────── */

export type AdminProduct = Record<string, any>;
export type AdminImage = {
  id: string;
  product_id: string;
  volume: string | null;
  source: "repo" | "cloudinary";
  storage_key: string | null;
  url: string | null;
  alt: string | null;
  position: number;
};

/**
 * Turns a Cloudinary upload rejection into something an admin can act on.
 *
 * "Invalid Signature" is the one worth translating. Cloudinary echoes back a
 * string-to-sign that matches ours exactly, so the raw error reads like a bug in the
 * upload code when it is really the API secret not belonging to the API key. Left
 * untranslated it sends whoever sees it looking in entirely the wrong place — run
 * scripts/check-cloudinary.mjs to confirm which credential is wrong.
 */
async function uploadFailure(res: Response): Promise<Error> {
  const text = await res.text().catch(() => "");
  if (/invalid signature/i.test(text)) {
    return new Error(
      "Cloudinary rejected the upload signature. The CLOUDINARY_API_SECRET on the server " +
        "does not match CLOUDINARY_API_KEY. Re-copy both from Cloudinary → Settings → API Keys " +
        "into Vercel, then redeploy."
    );
  }
  if (res.status === 401 || res.status === 403) {
    return new Error("Cloudinary refused the upload (not authorised). Check the API key and secret on the server.");
  }
  return new Error(`Upload failed: ${text.slice(0, 200)}`);
}

export const adminApi = {
  listProducts: () =>
    request<{ products: AdminProduct[]; images: AdminImage[] }>("/api/admin/products"),

  createProduct: (fields: Record<string, any>) =>
    request<{ product: AdminProduct }>("/api/admin/products", {
      method: "POST",
      body: JSON.stringify(fields),
    }),

  updateProduct: (id: string, fields: Record<string, any>) =>
    request<{ product: AdminProduct }>("/api/admin/products", {
      method: "PATCH",
      body: JSON.stringify({ id, ...fields }),
    }),

  /** Archives rather than deletes — see api/admin/products.ts for why. */
  archiveProduct: (id: string, restore = false) =>
    request<{ product: AdminProduct; archived: boolean }>("/api/admin/products", {
      method: "DELETE",
      body: JSON.stringify({ id, restore }),
    }),

  /* ── images ──────────────────────────────────────────────────────────────── */

  listImages: (productId?: string) =>
    request<{ images: AdminImage[] }>(
      `/api/admin/images${productId ? `?product_id=${encodeURIComponent(productId)}` : ""}`
    ),

  attachImage: (fields: {
    product_id: string;
    source: "repo" | "cloudinary";
    storage_key?: string;
    url?: string;
    volume?: string | null;
    alt?: string;
  }) =>
    request<{ image: AdminImage }>("/api/admin/images", {
      method: "POST",
      body: JSON.stringify(fields),
    }),

  reorderImages: (order: { id: string; position: number }[]) =>
    request<{ ok: true }>("/api/admin/images", {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  detachImage: (id: string) =>
    request<{ ok: true }>("/api/admin/images", {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),

  /** Edits one attached image in place — used to re-file a photo under a different
   *  size without re-uploading it. */
  updateImage: (fields: { id: string; volume?: string | null; alt?: string; position?: number }) =>
    request<{ image: AdminImage }>("/api/admin/images", {
      method: "PATCH",
      body: JSON.stringify(fields),
    }),

  /**
   * The product video, through the same signed direct-upload path as uploadImage but
   * against Cloudinary's video endpoint. A video posted to /image/upload is rejected
   * outright, and the signature is scoped to one endpoint, so this cannot share the
   * image signature.
   *
   * No transformation is signed for video: the image ceiling (c_limit,w_2000) would
   * force a re-encode of every upload, which Cloudinary bills for and which would
   * silently degrade a clip shot in portrait.
   */
  uploadVideo: async (file: File): Promise<string> => {
    if (!/^video\/(mp4|webm|quicktime)$/.test(file.type)) {
      throw new Error("Only MP4, WebM or MOV videos can be uploaded.");
    }
    const MAX_BYTES = 100 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      throw new Error(`That video is ${(file.size / 1e6).toFixed(1)}MB. Maximum is 100MB.`);
    }

    const sig = await request<{
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      allowedFormats: string;
      signature: string;
      uploadUrl: string;
    }>("/api/admin/images?action=sign", {
      method: "POST",
      body: JSON.stringify({ kind: "video" }),
    });

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("allowed_formats", sig.allowedFormats);
    form.append("signature", sig.signature);

    const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
    if (!res.ok) throw await uploadFailure(res);
    const body = await res.json();
    if (!body.secure_url) throw new Error("Upload succeeded but returned no URL");
    return body.secure_url as string;
  },


  /**
   * Uploads straight to Cloudinary using a short-lived signature from our server.
   * The file never passes through the serverless function, which would cap it at
   * ~4.5 MB — smaller than plenty of phone photos.
   */
  uploadImage: async (file: File): Promise<string> => {
    // Checked here purely so a mistake fails instantly with a clear message. The
    // real constraint is the signed allowed_formats on the server — Cloudinary
    // rejects anything outside it regardless of what this code sends.
    if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type)) {
      throw new Error("Only JPG, PNG, WebP or AVIF images can be uploaded.");
    }
    const MAX_BYTES = 15 * 1024 * 1024;
    if (file.size > MAX_BYTES) {
      throw new Error(`That image is ${(file.size / 1e6).toFixed(1)}MB. Maximum is 15MB.`);
    }

    const sig = await request<{
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      allowedFormats: string;
      transformation: string;
      signature: string;
      uploadUrl: string;
    }>("/api/admin/images?action=sign", { method: "POST", body: JSON.stringify({}) });

    // Every signed parameter must be echoed back exactly, or the signature fails.
    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("allowed_formats", sig.allowedFormats);
    form.append("transformation", sig.transformation);
    form.append("signature", sig.signature);

    const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
    if (!res.ok) throw await uploadFailure(res);
    const body = await res.json();
    if (!body.secure_url) throw new Error("Upload succeeded but returned no URL");
    return body.secure_url as string;
  },

  /* ── site content ────────────────────────────────────────────────────────── */

  list: <T = any>(resource: "banners" | "announcements" | "collections" | "settings") =>
    request<Record<string, T[]>>(`/api/admin/content?resource=${resource}`),

  create: (resource: "banners" | "announcements" | "collections", fields: Record<string, any>) =>
    request<any>(`/api/admin/content?resource=${resource}`, {
      method: "POST",
      body: JSON.stringify(fields),
    }),

  update: (
    resource: "banners" | "announcements" | "collections",
    id: string,
    fields: Record<string, any>
  ) =>
    request<any>(`/api/admin/content?resource=${resource}`, {
      method: "PATCH",
      body: JSON.stringify({ id, ...fields }),
    }),

  remove: (resource: "banners" | "announcements" | "collections", id: string) =>
    request<{ ok: true }>(`/api/admin/content?resource=${resource}`, {
      method: "DELETE",
      body: JSON.stringify({ id }),
    }),

  reorder: (
    resource: "banners" | "announcements" | "collections",
    order: { id: string; position: number }[]
  ) =>
    request<{ ok: true }>(`/api/admin/content?resource=${resource}`, {
      method: "PATCH",
      body: JSON.stringify({ order }),
    }),

  setSetting: (key: string, value: unknown) =>
    request<any>("/api/admin/content?resource=settings", {
      method: "POST",
      body: JSON.stringify({ key, value }),
    }),
};
