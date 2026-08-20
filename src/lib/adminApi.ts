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

  /**
   * Uploads straight to Cloudinary using a short-lived signature from our server.
   * The file never passes through the serverless function, which would cap it at
   * ~4.5 MB — smaller than plenty of phone photos.
   */
  uploadImage: async (file: File): Promise<string> => {
    const sig = await request<{
      cloudName: string;
      apiKey: string;
      timestamp: number;
      folder: string;
      signature: string;
      uploadUrl: string;
    }>("/api/admin/images?action=sign", { method: "POST", body: JSON.stringify({}) });

    const form = new FormData();
    form.append("file", file);
    form.append("api_key", sig.apiKey);
    form.append("timestamp", String(sig.timestamp));
    form.append("folder", sig.folder);
    form.append("signature", sig.signature);

    const res = await fetch(sig.uploadUrl, { method: "POST", body: form });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Upload failed: ${text.slice(0, 200)}`);
    }
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
