import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, Search, Trash2, RotateCcw, Save, X, ImagePlus,
  ArrowUp, ArrowDown, Star, Sparkles, TrendingUp, Package,
} from "lucide-react";
import { adminApi, type AdminProduct, type AdminImage } from "@/lib/adminApi";
import { resolveImage, repoImageKeys } from "@/lib/imageSource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatINR } from "@/store/shop";
import { VIDEO_HIDDEN } from "@/lib/catalog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CATEGORIES = ["Perfume", "Attar", "Gift Set", "Collector's Edition"] as const;
const GENDERS = ["Men", "Women", "Unisex"] as const;

/** A brand-new product starts here. Deliberately minimal — everything else is
 *  optional and can be filled in after the row exists. */
const BLANK = {
  slug: "",
  name: "",
  tagline: "",
  description: "",
  ingredients: "",
  category: "Perfume",
  gender: "Unisex",
  price: "",
  compare_at: "",
  volumes: [] as string[],
  featured_volume: "",
  badge: "",
  best_seller: false,
  new_arrival: false,
  trending: false,
  amazon_choice: false,
  rating: 4.6,
  reviews_count: 0,
};

/** A photo chosen before the product exists. Held in the editor until the create call
 *  returns an id, then attached. */
export type StagedImage = { source: "repo" | "cloudinary"; storageKey?: string; url?: string };

const previewUrl = (img: AdminImage) =>
  resolveImage({ source: img.source, storageKey: img.storage_key, url: img.url });

export default function AdminProducts() {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [images, setImages] = useState<AdminImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [staged, setStaged] = useState<StagedImage[]>([]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminApi.listProducts();
      setProducts(data.products ?? []);
      setImages(data.images ?? []);
    } catch (err: any) {
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => (showArchived ? p.archived : !p.archived))
      .filter((p) =>
        !q ||
        p.name?.toLowerCase().includes(q) ||
        p.slug?.toLowerCase().includes(q) ||
        p.category?.toLowerCase().includes(q)
      );
  }, [products, query, showArchived]);

  const imagesFor = useCallback(
    (id: string) => images.filter((i) => i.product_id === id).sort((a, b) => a.position - b.position),
    [images]
  );

  /** Toggling a flag writes immediately — these are one-click switches and a Save
   *  step for a single boolean would be friction with no benefit. Optimistic, with a
   *  reload on failure so the UI can't drift from the database. */
  const toggleFlag = async (p: AdminProduct, field: string) => {
    const next = !p[field];
    setProducts((prev) => prev.map((x) => (x.id === p.id ? { ...x, [field]: next } : x)));
    try {
      await adminApi.updateProduct(p.id, { [field]: next });
    } catch (err: any) {
      toast.error(err.message || "Update failed");
      load();
    }
  };

  const archive = async (p: AdminProduct) => {
    const restoring = Boolean(p.archived);
    if (!restoring && !confirm(`Archive "${p.name}"? It will be hidden from the shop but kept for order history.`)) return;
    try {
      await adminApi.archiveProduct(p.id, restoring);
      toast.success(restoring ? `${p.name} restored` : `${p.name} archived`);
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    }
  };

  const save = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      const payload: Record<string, any> = { ...editing };
      delete payload.__isNew;
      // Empty strings would clear a column that should stay untouched; the API
      // treats "" as "no value" for money, so strip them before sending.
      for (const k of Object.keys(payload)) {
        if (payload[k] === "") delete payload[k];
      }

      if (editing.__isNew) {
        const { product } = await adminApi.createProduct(payload);

        // Photos were chosen before the product had an id, so attach them now. Done
        // sequentially: position is assigned server-side from the current count, and
        // parallel calls would race for the same slot and scramble the gallery order.
        let attached = 0;
        for (const img of staged) {
          try {
            await adminApi.attachImage({
              product_id: product.id,
              source: img.source,
              storage_key: img.storageKey,
              url: img.url,
            });
            attached++;
          } catch (err: any) {
            // The product itself is already saved, so report and keep the rest.
            toast.error(`Photo ${attached + 1} could not be attached: ${err.message}`);
          }
        }
        toast.success(
          attached
            ? `${product.name} created with ${attached} photo${attached === 1 ? "" : "s"}`
            : `${product.name} created`
        );
      } else {
        const { id, ...fields } = payload;
        await adminApi.updateProduct(id, fields);
        toast.success("Saved");
      }
      setEditing(null);
      setStaged([]);
      load();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-3 text-muted-foreground">
        <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading products…
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <p className="text-[10px] tracking-[0.4em] uppercase text-primary">Catalogue</p>
          <h1 className="font-display text-3xl text-ivory mt-1">Products</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {products.filter((p) => !p.archived).length} live
            {products.some((p) => p.archived) && ` · ${products.filter((p) => p.archived).length} archived`}
          </p>
        </div>
        <Button variant="luxury" onClick={() => setEditing({ ...BLANK, __isNew: true })}>
          <Plus className="w-4 h-4 mr-2" /> New Product
        </Button>
      </div>

      {error && (
        <div className="rounded-sm border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug or category…"
            className="pl-9"
          />
        </div>
        <Button
          variant={showArchived ? "luxury" : "outline-gold"}
          onClick={() => setShowArchived((v) => !v)}
        >
          {showArchived ? "Showing archived" : "Show archived"}
        </Button>
      </div>

      <div className="space-y-2">
        {visible.map((p) => {
          const gallery = imagesFor(p.id);
          return (
            <div key={p.id} className="luxury-card p-3 sm:p-4 flex items-center gap-3 sm:gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-sm overflow-hidden bg-deep-brown">
                {gallery[0] ? (
                  <img src={previewUrl(gallery[0])} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-5 h-5 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-serif text-base sm:text-lg text-ivory truncate">{p.name}</h3>
                  {p.badge && (
                    <span className="text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded-sm bg-gradient-gold text-primary-foreground">
                      {p.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {p.category} · /{p.slug} · {gallery.length} photo{gallery.length === 1 ? "" : "s"}
                </p>
                <p className="text-sm text-gold mt-0.5">
                  {formatINR(Number(p.price))}
                  {p.compare_at && (
                    <span className="text-muted-foreground line-through ml-2 text-xs">
                      {formatINR(Number(p.compare_at))}
                    </span>
                  )}
                </p>
              </div>

              {/* One-click merchandising flags — the switches asked for most often. */}
              <div className="hidden md:flex items-center gap-1">
                {([
                  ["best_seller", Star, "Bestseller"],
                  ["new_arrival", Sparkles, "New"],
                  ["trending", TrendingUp, "Trending"],
                ] as const).map(([field, Icon, label]) => (
                  <button
                    key={field}
                    onClick={() => toggleFlag(p, field)}
                    title={label}
                    aria-label={`${label}: ${p[field] ? "on" : "off"}`}
                    className={cn(
                      "w-8 h-8 rounded-sm border flex items-center justify-center transition-colors",
                      p[field]
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border text-muted-foreground hover:text-ivory"
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline-gold" size="sm" onClick={() => setEditing({ ...p })}>
                  Edit
                </Button>
                <button
                  onClick={() => archive(p)}
                  title={p.archived ? "Restore" : "Archive"}
                  className="w-8 h-8 rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive/50 flex items-center justify-center"
                >
                  {p.archived ? <RotateCcw className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          );
        })}

        {!visible.length && (
          <p className="text-sm text-muted-foreground py-10 text-center">
            {query ? "No products match that search." : "Nothing here yet."}
          </p>
        )}
      </div>

      {editing && (
        <ProductEditor
          // Remounts per product, so the notes editor's local text state cannot carry
          // one bottle's pyramid over to the next.
          key={editing.id ?? "new"}
          value={editing}
          onChange={setEditing}
          staged={staged}
          setStaged={setStaged}
          onClose={() => { setEditing(null); setStaged([]); }}
          onSave={save}
          saving={saving}
          images={editing.id ? imagesFor(editing.id) : []}
          onImagesChanged={load}
        />
      )}
    </div>
  );
}

/* ── editor ────────────────────────────────────────────────────────────────── */

/**
 * Product editor.
 *
 * Creating a product asks for four things — name, category, price, photos — and nothing
 * else. Everything the storefront can live without starts collapsed behind "More
 * details", because the previous version asked for twelve fields up front and made
 * adding a product feel like filing a return.
 *
 * Photos can be chosen while creating. They are held locally until the product exists
 * (an image row needs a product_id) and attach immediately afterwards.
 */
function ProductEditor({
  value, onChange, onClose, onSave, saving, images, onImagesChanged, staged, setStaged,
}: {
  value: Record<string, any>;
  onChange: (v: Record<string, any>) => void;
  onClose: () => void;
  onSave: () => void;
  saving: boolean;
  images: AdminImage[];
  onImagesChanged: () => void;
  staged: StagedImage[];
  setStaged: (s: StagedImage[]) => void;
}) {
  const set = (field: string, v: any) => onChange({ ...value, [field]: v });
  const isNew = Boolean(value.__isNew);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Slug follows the name while creating, so it is one less thing to think about. Once
  // a product exists its slug is a live URL, so it stops auto-following.
  const setName = (name: string) => {
    if (!isNew) { set("name", name); return; }
    onChange({
      ...value,
      name,
      slug: name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    });
  };

  const ready = Boolean(String(value.name ?? "").trim() && String(value.price ?? "").trim());

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-2xl luxury-card p-5 sm:p-7 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-primary">
                {isNew ? "New product" : "Edit"}
              </p>
              <h2 className="font-display text-2xl text-ivory mt-1">{value.name || "Untitled"}</h2>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-ivory">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ── the four things that actually matter ───────────────────────── */}
          <div className="space-y-3">
            <Field label="Product name">
              <Input
                value={value.name ?? ""}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Royal Oud"
                autoFocus={isNew}
              />
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Category">
                <select
                  value={value.category ?? "Perfume"}
                  onChange={(e) => set("category", e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Price (₹)">
                <Input
                  type="number" inputMode="decimal" min="0"
                  value={value.price ?? ""}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="499"
                />
              </Field>
            </div>

            <SizePicker
              category={value.category ?? "Perfume"}
              volumes={value.volumes ?? []}
              onChange={(v) => set("volumes", v)}
            />
          </div>

          {/* ── photos, available while creating ───────────────────────────── */}
          {isNew
            ? <StagedImagePicker staged={staged} setStaged={setStaged} />
            : <ImageManager
                productId={value.id}
                images={images}
                volumes={value.volumes ?? []}
                onChanged={onImagesChanged}
              />}

          {/* ── everything else ────────────────────────────────────────────── */}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="w-full flex items-center justify-between border-t border-border pt-4 text-left"
          >
            <span className="text-[10px] tracking-luxe uppercase text-primary">More details</span>
            <span className="text-xs text-muted-foreground">
              {showAdvanced ? "Hide" : "Optional — tagline, description, badges, per-size pricing"}
            </span>
          </button>

          {showAdvanced && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <Field label="Tagline">
                  <Input value={value.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="A short line under the name" />
                </Field>
                <Field label="MRP (₹)" hint="Struck through next to the price.">
                  <Input type="number" min="0" value={value.compare_at ?? ""} onChange={(e) => set("compare_at", e.target.value)} />
                </Field>
                <Field label="Gender">
                  <select
                    value={value.gender ?? "Unisex"}
                    onChange={(e) => set("gender", e.target.value)}
                    className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
                  >
                    {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
                  </select>
                </Field>
                <Field label="Badge" hint="Corner label on the shop card.">
                  <Input value={value.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="Bestseller" />
                </Field>
              </div>

              <Field label="Description">
                <textarea
                  rows={3}
                  value={value.description ?? ""}
                  onChange={(e) => set("description", e.target.value)}
                  className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
                />
              </Field>

              <Field label="Ingredients">
                <Input value={value.ingredients ?? ""} onChange={(e) => set("ingredients", e.target.value)} />
              </Field>

              <Field
                label="URL slug"
                hint={isNew ? "Filled in from the name." : "Changing this breaks existing links to the product."}
              >
                <Input
                  value={value.slug ?? ""}
                  onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                />
              </Field>

              <div>
                <p className="text-[10px] tracking-luxe uppercase text-primary mb-2">Show on</p>
                <div className="flex flex-wrap gap-2">
                  {([
                    ["best_seller", "Bestsellers"],
                    ["new_arrival", "New Arrivals"],
                    ["trending", "Trending"],
                    ["amazon_choice", "Amazon's Choice"],
                  ] as const).map(([field, label]) => (
                    <button
                      key={field}
                      type="button"
                      onClick={() => set(field, !value[field])}
                      className={cn(
                        "px-3 py-2 rounded-sm border text-xs transition-colors",
                        value[field]
                          ? "border-primary bg-primary/15 text-primary"
                          : "border-border text-muted-foreground hover:text-ivory"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {(value.volumes ?? []).length > 0 && (
                <PerSizePricing
                  volumes={value.volumes ?? []}
                  value={value.price_by_volume ?? {}}
                  onChange={(v) => set("price_by_volume", v)}
                />
              )}

              {(value.volumes ?? []).length > 1 && (
                <Field label="Featured size" hint="Which size the shop card prices and pictures.">
                  <div className="flex flex-wrap gap-2">
                    {(value.volumes ?? []).map((v: string) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => set("featured_volume", value.featured_volume === v ? "" : v)}
                        className={cn(
                          "px-3 py-1.5 rounded-sm border text-xs",
                          value.featured_volume === v
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:text-ivory"
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              <NotesEditor
                value={value.notes}
                onChange={(next) => set("notes", next)}
              />

              <VideoManager
                value={value.video_url}
                onChange={(next) => set("video_url", next)}
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-t border-border pt-5">
            <p className="text-[11px] text-muted-foreground">
              {ready ? "" : "Name and price are required."}
            </p>
            <div className="flex gap-3">
              <Button variant="ghostGold" onClick={onClose}>Cancel</Button>
              <Button variant="luxury" onClick={onSave} disabled={saving || !ready}>
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                {isNew ? "Create product" : "Save changes"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Common bottle sizes as toggles. This was a comma-separated text box, which meant
 *  remembering the exact spelling ("50ml" vs "50 ml") for per-size pricing to line up. */
function SizePicker({
  category, volumes, onChange,
}: {
  category: string;
  volumes: string[];
  onChange: (v: string[]) => void;
}) {
  const [custom, setCustom] = useState("");
  // Attars sell in one small bottle, perfumes in a standard ladder. Offering the right
  // presets first is most of what makes this faster than typing.
  const presets = category === "Attar" ? ["10ml", "12ml", "25ml"] : ["20ml", "50ml", "100ml"];
  const options = [...new Set([...presets, ...volumes])];

  const toggle = (size: string) =>
    onChange(volumes.includes(size) ? volumes.filter((v) => v !== size) : [...volumes, size]);

  const addCustom = () => {
    const v = custom.trim();
    if (!v || volumes.includes(v)) { setCustom(""); return; }
    onChange([...volumes, v]);
    setCustom("");
  };

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">Sizes</span>
      <div className="flex flex-wrap gap-2">
        {options.map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => toggle(size)}
            className={cn(
              "px-3 py-1.5 rounded-sm border text-xs transition-colors",
              volumes.includes(size)
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-ivory"
            )}
          >
            {size}
          </button>
        ))}
        <div className="flex items-center gap-1">
          <input
            value={custom}
            onChange={(e) => setCustom(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addCustom(); } }}
            placeholder="Other…"
            className="w-20 rounded-sm border border-border bg-background px-2 py-1.5 text-xs text-ivory"
          />
          {custom.trim() && (
            <button type="button" onClick={addCustom} className="text-primary text-xs px-1">Add</button>
          )}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground/70">
        {volumes.length
          ? `Selected: ${volumes.join(", ")}`
          : "Leave empty if this product is sold in one size only."}
      </p>
    </div>
  );
}

/**
 * Photo picker for a product that does not exist yet.
 *
 * An image row needs a product_id, which only exists after the create call — so these
 * are held here and attached the moment the product is saved. The Cloudinary upload
 * itself happens now, so a slow connection is paid for while the form is still open
 * rather than at the point of saving.
 */
function StagedImagePicker({
  staged, setStaged,
}: {
  staged: StagedImage[];
  setStaged: (s: StagedImage[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (needle ? repoImageKeys.filter((k) => k.toLowerCase().includes(needle)) : repoImageKeys).slice(0, 40);
  }, [q]);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      const added: StagedImage[] = [];
      for (const file of Array.from(files)) {
        const url = await adminApi.uploadImage(file);
        added.push({ source: "cloudinary", url });
      }
      setStaged([...staged, ...added]);
      toast.success(`${added.length} photo${added.length === 1 ? "" : "s"} ready`);
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-border pt-4 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] tracking-luxe uppercase text-primary">Photos</p>
          <p className="text-[10px] text-muted-foreground/70">First one becomes the main image.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline-gold" size="sm" onClick={() => setPicking((v) => !v)} disabled={busy}>
            {picking ? "Close" : "Pick existing"}
          </Button>
          <label>
            <Button variant="luxury" size="sm" disabled={busy} asChild>
              <span className="cursor-pointer">
                {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 mr-1.5" />}
                Upload
              </span>
            </Button>
            <input type="file" accept="image/*" multiple hidden onChange={(e) => { upload(e.target.files); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      {staged.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
          {staged.map((img, i) => (
            <div key={i} className="relative group rounded-sm overflow-hidden border border-border">
              <img
                src={resolveImage({ source: img.source, storageKey: img.storageKey, url: img.url })}
                alt=""
                className="w-full aspect-square object-cover"
              />
              {i === 0 && (
                <span className="absolute top-1 left-1 text-[8px] uppercase px-1 py-0.5 rounded-sm bg-gradient-gold text-primary-foreground">
                  Main
                </span>
              )}
              <button
                onClick={() => setStaged(staged.filter((_, j) => j !== i))}
                className="absolute inset-x-0 bottom-0 bg-background/85 py-1 opacity-0 group-hover:opacity-100 text-destructive"
              >
                <Trash2 className="w-3 h-3 mx-auto" />
              </button>
            </div>
          ))}
        </div>
      )}

      {picking && (
        <div className="space-y-2 border border-border rounded-sm p-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos already on the site…" autoFocus />
          <div className="grid grid-cols-5 sm:grid-cols-8 gap-2 max-h-48 overflow-y-auto">
            {matches.map((key) => (
              <button
                key={key}
                title={key}
                onClick={() => setStaged([...staged, { source: "repo", storageKey: key }])}
                className="rounded-sm overflow-hidden border border-border hover:border-primary"
              >
                <img src={resolveImage({ source: "repo", storageKey: key })} alt="" loading="lazy" className="w-full aspect-square object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {!staged.length && !picking && (
        <p className="text-xs text-muted-foreground">
          No photos yet — a product without one shows a blank tile in the shop.
        </p>
      )}
    </div>
  );
}


function PerSizePricing({
  volumes, value, onChange,
}: {
  volumes: string[];
  value: Record<string, { price?: number | string; compareAt?: number | string }>;
  onChange: (v: Record<string, any>) => void;
}) {
  if (!volumes.length) {
    return (
      <p className="text-xs text-muted-foreground">
        Add sizes above to set a price per size. Without per-size prices, every size uses the price above.
      </p>
    );
  }

  const setEntry = (size: string, field: "price" | "compareAt", v: string) => {
    const next = { ...value, [size]: { ...(value[size] ?? {}), [field]: v } };
    if (v === "") delete next[size][field];
    if (!Object.keys(next[size]).length) delete next[size];
    onChange(next);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-luxe uppercase text-primary">Price per size</p>
      <div className="space-y-2">
        {volumes.map((size) => (
          <div key={size} className="flex items-center gap-2">
            <span className="w-16 text-xs text-muted-foreground shrink-0">{size}</span>
            <Input
              type="number" min="0" placeholder="Price"
              value={value[size]?.price ?? ""}
              onChange={(e) => setEntry(size, "price", e.target.value)}
            />
            <Input
              type="number" min="0" placeholder="MRP"
              value={value[size]?.compareAt ?? ""}
              onChange={(e) => setEntry(size, "compareAt", e.target.value)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── images ────────────────────────────────────────────────────────────────── */

/** The "belongs to the product as a whole" bucket — stored as a null volume, but given
 *  a name here so it can be a tab like any size. */
const GENERAL = "__general__";

function ImageManager({
  productId, images, volumes, onChanged,
}: {
  productId: string;
  images: AdminImage[];
  volumes: string[];
  onChanged: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [tab, setTab] = useState<string>("all");

  /** Every bucket that either holds photos or could take them. A size the product no
   *  longer sells still gets a tab while it holds images — otherwise those photos would
   *  be invisible here and impossible to delete. */
  const tabs = useMemo(() => {
    const ordered = [GENERAL, ...volumes.filter(Boolean)];
    for (const img of images) {
      const key = img.volume ?? GENERAL;
      if (!ordered.includes(key)) ordered.push(key);
    }
    return ordered;
  }, [images, volumes]);

  const countIn = (key: string) => images.filter((i) => (i.volume ?? GENERAL) === key).length;

  const visible = useMemo(
    () => (tab === "all" ? images : images.filter((i) => (i.volume ?? GENERAL) === tab)),
    [images, tab]
  );

  /** The size a newly added photo is filed under. On "All" this is deliberately null
   *  rather than a guess — filing under the wrong size is the mistake these tabs exist
   *  to prevent. */
  const targetVolume = tab === "all" || tab === GENERAL ? null : tab;

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true);
    try {
      for (const file of Array.from(files)) {
        const url = await adminApi.uploadImage(file);
        await adminApi.attachImage({
          product_id: productId, source: "cloudinary", url, volume: targetVolume,
        });
      }
      const n = files.length;
      toast.success(
        targetVolume
          ? n + " image" + (n === 1 ? "" : "s") + " added to " + targetVolume
          : n + " image" + (n === 1 ? "" : "s") + " added"
      );
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  /** Moving an image rewrites every position in one call — the first image is the
   *  product's hero, so a partial reorder would change which photo fronts the product.
   *  The swap is worked out in the filtered view the admin is actually looking at, then
   *  applied to the full list so the other sizes keep their slots. */
  const move = async (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= visible.length) return;
    const next = [...images];
    const a = next.findIndex((x) => x.id === visible[index].id);
    const b = next.findIndex((x) => x.id === visible[target].id);
    if (a < 0 || b < 0) return;
    [next[a], next[b]] = [next[b], next[a]];
    setBusy(true);
    try {
      await adminApi.reorderImages(next.map((img, i) => ({ id: img.id, position: i })));
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Reorder failed");
    } finally {
      setBusy(false);
    }
  };

  /** Re-file a photo under a different size without re-uploading it — the usual repair
   *  when a batch landed in the wrong bucket. */
  const assign = async (img: AdminImage, volume: string | null) => {
    setBusy(true);
    try {
      await adminApi.updateImage({ id: img.id, volume });
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const detach = async (img: AdminImage) => {
    setBusy(true);
    try {
      await adminApi.detachImage(img.id);
      onChanged();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const tabLabel = (key: string) => (key === GENERAL ? "No size" : key);

  return (
    <div className="border-t border-border pt-5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] tracking-luxe uppercase text-primary">
          Photos · first is the main image
        </p>
        <div className="flex items-center gap-2">
          <Button variant="outline-gold" size="sm" onClick={() => setPicking(true)} disabled={busy}>
            Pick existing
          </Button>
          <label>
            <Button variant="luxury" size="sm" disabled={busy} asChild>
              <span className="cursor-pointer">
                {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 mr-1.5" />}
                Upload
              </span>
            </Button>
            <input
              type="file" accept="image/*" multiple hidden
              onChange={(e) => { upload(e.target.files); e.target.value = ""; }}
            />
          </label>
        </div>
      </div>

      {/* One size at a time. A product with per-size galleries carries 20+ photos, and
          picking the right one to delete out of a single flat grid is guesswork. */}
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={cn(
            "px-2.5 py-1 rounded-sm border text-[11px] transition-colors",
            tab === "all"
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-ivory"
          )}
        >
          All ({images.length})
        </button>
        {tabs.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={cn(
              "px-2.5 py-1 rounded-sm border text-[11px] transition-colors",
              tab === key
                ? "border-primary bg-primary/15 text-primary"
                : "border-border text-muted-foreground hover:text-ivory"
            )}
          >
            {tabLabel(key)} ({countIn(key)})
          </button>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground/70">
        {tab === "all"
          ? "Showing every photo. Pick a size to add or remove photos for just that bottle."
          : targetVolume
            ? "Uploads and picks on this tab are filed under " + targetVolume + "."
            : "These photos have no size, and are used for any size that has none of its own."}
      </p>

      <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
        {visible.map((img, i) => (
          <div key={img.id} className="relative group rounded-sm overflow-hidden border border-border">
            <img src={previewUrl(img)} alt="" className="w-full aspect-square object-cover" />
            {images[0]?.id === img.id && (
              <span className="absolute top-1 left-1 text-[8px] uppercase tracking-wide px-1 py-0.5 rounded-sm bg-gradient-gold text-primary-foreground">
                Main
              </span>
            )}
            {tab === "all" && (
              <span className="absolute bottom-1 left-1 text-[8px] px-1 py-0.5 rounded-sm bg-background/80 text-muted-foreground">
                {img.volume ?? "No size"}
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 p-1 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => move(i, -1)} disabled={i === 0 || busy} title="Move earlier" className="p-1 disabled:opacity-30 hover:text-primary">
                <ArrowUp className="w-3 h-3" />
              </button>
              <button onClick={() => move(i, 1)} disabled={i === visible.length - 1 || busy} title="Move later" className="p-1 disabled:opacity-30 hover:text-primary">
                <ArrowDown className="w-3 h-3" />
              </button>
              <button onClick={() => detach(img)} disabled={busy} title="Remove from product" className="p-1 hover:text-destructive">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            {/* Re-file without re-uploading. Only worth showing when there is somewhere
                else to file it to. */}
            {tabs.length > 1 && (
              <select
                value={img.volume ?? GENERAL}
                disabled={busy}
                title="Move to a different size"
                onChange={(e) => assign(img, e.target.value === GENERAL ? null : e.target.value)}
                className="absolute top-1 right-1 max-w-[62%] rounded-sm border border-border bg-background/90 text-[9px] text-muted-foreground px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100"
              >
                {tabs.map((key) => (
                  <option key={key} value={key}>{tabLabel(key)}</option>
                ))}
              </select>
            )}
          </div>
        ))}
        {!visible.length && (
          <p className="col-span-full text-xs text-muted-foreground py-4">
            {tab === "all" ? "No photos yet." : "No photos filed under " + tabLabel(tab) + " yet."}
          </p>
        )}
      </div>

      {picking && (
        <RepoImagePicker
          productId={productId}
          volume={targetVolume}
          onClose={() => setPicking(false)}
          onPicked={() => { setPicking(false); onChanged(); }}
        />
      )}
    </div>
  );
}

/**
 * Picks from the photos already committed under src/assets/. These serve free from
 * Vercel's CDN, so reusing one costs nothing — worth offering before an upload.
 */
function RepoImagePicker({
  productId, volume, onClose, onPicked,
}: {
  productId: string;
  /** Size the picked photo is filed under; null is the general gallery. */
  volume: string | null;
  onClose: () => void;
  onPicked: () => void;
}) {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return repoImageKeys.slice(0, 60);
    return repoImageKeys.filter((k) => k.toLowerCase().includes(needle)).slice(0, 60);
  }, [q]);

  const attach = async (key: string) => {
    setBusy(true);
    try {
      await adminApi.attachImage({ product_id: productId, source: "repo", storage_key: key, volume });
      toast.success(volume ? `Photo added to ${volume}` : "Photo added");
      onPicked();
    } catch (err: any) {
      toast.error(err.message || "Failed");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/90 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-2xl luxury-card p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-xl text-ivory">Existing photos</h3>
            <button onClick={onClose} className="text-muted-foreground hover:text-ivory">
              <X className="w-5 h-5" />
            </button>
          </div>
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by filename or folder — e.g. maati, celebrity, 50 ml"
            autoFocus
          />
          <p className="text-[11px] text-muted-foreground">
            {matches.length} of {repoImageKeys.length} shown
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 max-h-[55vh] overflow-y-auto">
            {matches.map((key) => (
              <button
                key={key}
                onClick={() => attach(key)}
                disabled={busy}
                title={key}
                className="rounded-sm overflow-hidden border border-border hover:border-primary transition-colors disabled:opacity-50"
              >
                <img
                  src={resolveImage({ source: "repo", storageKey: key })}
                  alt=""
                  loading="lazy"
                  className="w-full aspect-square object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Fragrance pyramid editor.
 *
 * `notes` is a jsonb column shaped { top: [], heart: [], base: [] }, which the product
 * page renders as one "·"-joined line per tier. Comma-separated text is how a perfumer
 * actually writes a pyramid, so the split happens here rather than asking an admin to
 * hand-edit JSON.
 *
 * The typed text is held in local state instead of being derived back from the parsed
 * array on every keystroke. Deriving it would delete the separator as it was typed:
 * "Rose, " parses to ["Rose"], which joins back to "Rose", eating the comma mid-word.
 */
function NotesEditor({
  value, onChange,
}: {
  value: { top?: string[]; heart?: string[]; base?: string[] } | null | undefined;
  onChange: (next: { top: string[]; heart: string[]; base: string[] }) => void;
}) {
  const TIERS = [
    ["top", "Top notes", "Bergamot, Pink Pepper"],
    ["heart", "Heart notes", "Jasmine, Saffron"],
    ["base", "Base notes", "Amber, Vanilla, Musk"],
  ] as const;

  const [text, setText] = useState(() => ({
    top: (value?.top ?? []).join(", "),
    heart: (value?.heart ?? []).join(", "),
    base: (value?.base ?? []).join(", "),
  }));

  const parse = (s: string) => s.split(",").map((v) => v.trim()).filter(Boolean);

  const edit = (tier: "top" | "heart" | "base", next: string) => {
    const merged = { ...text, [tier]: next };
    setText(merged);
    // All three tiers go every time. The storefront reads all of them, and a key left
    // out of the jsonb renders as an empty pyramid row rather than being skipped.
    onChange({ top: parse(merged.top), heart: parse(merged.heart), base: parse(merged.base) });
  };

  return (
    <div>
      <p className="text-[10px] tracking-luxe uppercase text-primary mb-2">Fragrance pyramid</p>
      <div className="grid sm:grid-cols-3 gap-3">
        {TIERS.map(([key, label, placeholder]) => (
          <Field key={key} label={label} hint="Separate notes with commas.">
            <Input
              value={text[key]}
              onChange={(e) => edit(key, e.target.value)}
              placeholder={placeholder}
            />
          </Field>
        ))}
      </div>
    </div>
  );
}

/**
 * Product video — the clip that plays as the second slide of the gallery.
 *
 * Kept in products.video_url, which has three meaningful states:
 *
 *   a URL          an uploaded or pasted clip. Wins over everything.
 *   empty / null   nothing chosen, so a clip bundled in the repo for this product still
 *                  shows (see SNAPSHOT_VIDEO_BY_SLUG in src/store/catalog.tsx).
 *   VIDEO_HIDDEN   "this product has no video". The only way to switch off a bundled
 *                  clip — merely clearing the field would let it come straight back.
 *
 * Nothing here writes to the database on its own; it edits the row being edited, and
 * Save changes commits it, the same as every other field in this form.
 */
function VideoManager({
  value, onChange,
}: {
  value: string | null | undefined;
  onChange: (next: string | null) => void;
}) {
  const [busy, setBusy] = useState(false);
  const hidden = value === VIDEO_HIDDEN;
  const url = !hidden && value ? String(value) : "";

  const upload = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      onChange(await adminApi.uploadVideo(file));
      toast.success("Video uploaded — press Save changes to publish it");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[10px] tracking-luxe uppercase text-primary mb-2">Product video</p>

      {url && (
        <video
          src={url}
          controls
          muted
          playsInline
          preload="metadata"
          className="w-full max-w-xs aspect-square object-contain rounded-sm border border-border bg-deep-brown mb-2"
        />
      )}

      <div className="flex flex-wrap items-center gap-2 mb-2">
        <label>
          <Button variant="luxury" size="sm" disabled={busy} asChild>
            <span className="cursor-pointer">
              {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 mr-1.5" />}
              {url ? "Replace video" : "Upload video"}
            </span>
          </Button>
          <input
            type="file" accept="video/mp4,video/webm,video/quicktime" hidden
            onChange={(e) => { upload(e.target.files); e.target.value = ""; }}
          />
        </label>

        {url && (
          <Button variant="ghostGold" size="sm" disabled={busy} onClick={() => onChange(null)}>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Remove
          </Button>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => onChange(hidden ? null : VIDEO_HIDDEN)}
          className={cn(
            "px-3 py-1.5 rounded-sm border text-xs transition-colors",
            hidden
              ? "border-primary bg-primary/15 text-primary"
              : "border-border text-muted-foreground hover:text-ivory"
          )}
        >
          {hidden ? "Video hidden" : "Hide video"}
        </button>
      </div>

      <Field
        label="Video URL"
        hint="Paste a direct .mp4/.webm link, or use Upload above. Leave empty to fall back to a clip bundled with the site."
      >
        <Input
          value={url}
          disabled={hidden}
          onChange={(e) => onChange(e.target.value.trim() || null)}
          placeholder="https://res.cloudinary.com/..."
        />
      </Field>

      <p className="text-[10px] text-muted-foreground/70 mt-1">
        {hidden
          ? "No video will show on this product, even if the site ships one for it."
          : url
            ? "Plays muted as the second slide of the gallery."
            : "Nothing set — if the site bundles a clip for this product, that one plays."}
      </p>
    </div>
  );
}

/* ── layout helpers ────────────────────────────────────────────────────────── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-[10px] tracking-luxe uppercase text-primary border-b border-border pb-2">{title}</p>
      <div className="grid sm:grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-muted-foreground/70">{hint}</span>}
    </label>
  );
}
