import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Loader2, Plus, Trash2, Save, X, ArrowUp, ArrowDown, ImagePlus,
  Megaphone, Images, LayoutGrid, Settings2, Eye, EyeOff,
} from "lucide-react";
import { adminApi } from "@/lib/adminApi";
import { resolveImage, repoImageKeys } from "@/lib/imageSource";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Tab = "banners" | "announcements" | "collections" | "settings";

const TABS: { key: Tab; label: string; icon: typeof Megaphone }[] = [
  { key: "banners", label: "Hero Banners", icon: Images },
  { key: "announcements", label: "Announcement Bar", icon: Megaphone },
  { key: "collections", label: "Collections", icon: LayoutGrid },
  { key: "settings", label: "Settings", icon: Settings2 },
];

export default function AdminContent() {
  const [tab, setTab] = useState<Tab>("banners");

  return (
    <div className="p-4 sm:p-8 space-y-6">
      <div>
        <p className="text-[10px] tracking-[0.4em] uppercase text-primary">Website</p>
        <h1 className="font-display text-3xl text-ivory mt-1">Content</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Changes appear on the live site within a minute — no redeploy needed.
        </p>
      </div>

      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
              tab === key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-ivory"
            )}
          >
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "banners" && <BannersTab />}
      {tab === "announcements" && <AnnouncementsTab />}
      {tab === "collections" && <CollectionsTab />}
      {tab === "settings" && <SettingsTab />}
    </div>
  );
}

/* ── shared list plumbing ──────────────────────────────────────────────────── */

function useResource<T extends { id: string; position: number }>(
  resource: "banners" | "announcements" | "collections"
) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.list<T>(resource);
      setRows((data[resource] ?? []) as T[]);
    } catch (err: any) {
      toast.error(err.message || `Failed to load ${resource}`);
    } finally {
      setLoading(false);
    }
  }, [resource]);

  useEffect(() => { load(); }, [load]);

  /** Reorder ships the whole list in one call — a half-applied reorder would leave
   *  two rows claiming the same slot. */
  const move = async (index: number, delta: number) => {
    const next = [...rows];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setRows(next);
    setBusy(true);
    try {
      await adminApi.reorder(resource, next.map((r, i) => ({ id: r.id, position: i })));
    } catch (err: any) {
      toast.error(err.message || "Reorder failed");
      load();
    } finally {
      setBusy(false);
    }
  };

  const remove = async (row: T, label: string) => {
    if (!confirm(`Delete ${label}?`)) return;
    setBusy(true);
    try {
      await adminApi.remove(resource, row.id);
      toast.success("Deleted");
      load();
    } catch (err: any) {
      toast.error(err.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (row: T & { active?: boolean }) => {
    const next = !row.active;
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, active: next } : r)) as T[]);
    try {
      await adminApi.update(resource, row.id, { active: next });
    } catch (err: any) {
      toast.error(err.message || "Update failed");
      load();
    }
  };

  return { rows, setRows, loading, busy, setBusy, load, move, remove, toggleActive };
}

function Spinner() {
  return (
    <div className="py-10 flex items-center gap-3 text-muted-foreground">
      <Loader2 className="w-5 h-5 animate-spin text-primary" /> Loading…
    </div>
  );
}

/* ── banners ───────────────────────────────────────────────────────────────── */

function BannersTab() {
  const { rows, loading, busy, load, move, remove, toggleActive } = useResource<any>("banners");
  const [editing, setEditing] = useState<any | null>(null);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          The rotating hero at the top of the homepage. Order here is the order they rotate.
        </p>
        <Button variant="luxury" size="sm" onClick={() => setEditing({ __isNew: true, source: "repo", active: true })}>
          <Plus className="w-4 h-4 mr-2" /> New Banner
        </Button>
      </div>

      {!rows.length && (
        <div className="luxury-card p-6 text-sm text-muted-foreground">
          No banners yet. Until one is added, the homepage keeps using the hero images built
          into the site — adding one here takes over.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((b, i) => (
          <div key={b.id} className={cn("luxury-card p-3 flex items-center gap-4", !b.active && "opacity-50")}>
            <div className="w-24 h-14 shrink-0 rounded-sm overflow-hidden bg-deep-brown">
              <img
                src={resolveImage({ source: b.source, storageKey: b.storage_key, url: b.url })}
                alt="" className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ivory truncate">{b.headline || <em className="text-muted-foreground">No headline</em>}</p>
              {b.highlight && <p className="text-[11px] text-gold italic truncate">{b.highlight}</p>}
              <p className="text-[11px] text-muted-foreground truncate">{b.subtext || "—"}</p>
              {b.cta_label && (
                <p className="text-[10px] text-primary mt-0.5">{b.cta_label} → {b.cta_href}</p>
              )}
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                {b.mobile_storage_key || b.mobile_url
                  ? `Separate mobile image · ${b.mobile_fit === "contain" ? "fit" : "fill"}`
                  : "Mobile uses the desktop image"}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <IconBtn onClick={() => toggleActive(b)} title={b.active ? "Hide" : "Show"}>
                {b.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </IconBtn>
              <IconBtn onClick={() => move(i, -1)} disabled={i === 0 || busy}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => move(i, 1)} disabled={i === rows.length - 1 || busy}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
              <Button variant="outline-gold" size="sm" onClick={() => setEditing({ ...b })}>Edit</Button>
              <IconBtn onClick={() => remove(b, "this banner")} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <BannerEditor
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function BannerEditor({ value, onChange, onClose, onSaved }: any) {
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...value };
      delete payload.__isNew;
      delete payload.created_at;
      delete payload.updated_at;
      if (value.__isNew) {
        delete payload.id;
        await adminApi.create("banners", payload);
      } else {
        const { id, ...fields } = payload;
        await adminApi.update("banners", id, fields);
      }
      toast.success("Saved");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={value.__isNew ? "New banner" : "Edit banner"} onClose={onClose}>
      <BannerPreview value={value} />
      <ImageField
        label="Desktop image"
        hint="Wide artwork. The headline and subtext below are drawn over it in HTML."
        source={value.source}
        storageKey={value.storage_key}
        url={value.url}
        onChange={(ref) => onChange({ ...value, source: ref.source, storage_key: ref.storageKey, url: ref.url })}
      />

      <div className="rounded-sm border border-border p-3 space-y-3">
        <ImageField
          label="Mobile image"
          hint="Tall 9:16 artwork with the headline built into the image. Optional — falls back to the desktop image."
          source={value.mobile_source}
          storageKey={value.mobile_storage_key}
          url={value.mobile_url}
          onChange={(ref) =>
            onChange({
              ...value,
              mobile_source: ref.source,
              mobile_storage_key: ref.storageKey,
              mobile_url: ref.url,
              // Default new mobile art to cover; the picker below can override.
              mobile_fit: value.mobile_fit ?? "cover",
            })
          }
        />
        <Labelled
          label="Mobile framing"
          hint="Fill crops to 9:16 — right for artwork shot at that ratio. Fit letterboxes instead, which 4:5 artwork needs or a third of its width (and its headline) is cropped away."
        >
          <div className="flex gap-2">
            {(["cover", "contain"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => set("mobile_fit", f)}
                className={cn(
                  "px-3 py-2 rounded-sm border text-xs transition-colors",
                  (value.mobile_fit ?? "cover") === f
                    ? "border-primary bg-primary/15 text-primary"
                    : "border-border text-muted-foreground hover:text-ivory"
                )}
              >
                {f === "cover" ? "Fill (9:16 art)" : "Fit (4:5 art)"}
              </button>
            ))}
          </div>
        </Labelled>
        {(value.mobile_storage_key || value.mobile_url) && (
          <button
            type="button"
            onClick={() =>
              onChange({ ...value, mobile_source: null, mobile_storage_key: null, mobile_url: null })
            }
            className="text-[11px] text-muted-foreground hover:text-destructive underline"
          >
            Remove mobile image (use the desktop one)
          </button>
        )}
      </div>

      <Labelled label="Eyebrow" hint="Small text above the headline. Desktop only.">
        <Input value={value.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} />
      </Labelled>
      <div className="grid sm:grid-cols-2 gap-3">
        <Labelled label="Headline" hint="Desktop only. Also the mobile image's alt text.">
          <Input value={value.headline ?? ""} onChange={(e) => set("headline", e.target.value)} />
        </Labelled>
        <Labelled label="Second line" hint="Shown under the headline in italic gold — e.g. Buy 1 Get 1 Free.">
          <Input value={value.highlight ?? ""} onChange={(e) => set("highlight", e.target.value)} />
        </Labelled>
      </div>
      <Labelled label="Subtext" hint="Desktop only.">
        <textarea
          rows={2}
          value={value.subtext ?? ""}
          onChange={(e) => set("subtext", e.target.value)}
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm text-ivory"
        />
      </Labelled>
      <div className="grid sm:grid-cols-2 gap-3">
        <Labelled label="Button label">
          <Input value={value.cta_label ?? ""} onChange={(e) => set("cta_label", e.target.value)} placeholder="Shop Now" />
        </Labelled>
        <Labelled label="Button link">
          <Input value={value.cta_href ?? ""} onChange={(e) => set("cta_href", e.target.value)} placeholder="/shop" />
        </Labelled>
      </div>
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ── announcements ─────────────────────────────────────────────────────────── */

function AnnouncementsTab() {
  const { rows, loading, busy, setBusy, load, move, remove, toggleActive } = useResource<any>("announcements");
  const [draft, setDraft] = useState("");

  const add = async () => {
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    try {
      await adminApi.create("announcements", { text, active: true });
      setDraft("");
      load();
    } catch (err: any) {
      toast.error(err.message || "Failed");
    } finally {
      setBusy(false);
    }
  };

  const saveText = async (row: any, text: string) => {
    if (text === row.text) return;
    try {
      await adminApi.update("announcements", row.id, { text });
      toast.success("Saved");
    } catch (err: any) {
      toast.error(err.message || "Failed");
      load();
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        The gold bar at the very top of every page. Lines rotate every few seconds in this order.
      </p>

      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a line — e.g. Free Shipping on All Orders"
        />
        <Button variant="luxury" onClick={add} disabled={busy || !draft.trim()}>
          <Plus className="w-4 h-4 mr-2" /> Add
        </Button>
      </div>

      {!rows.length && (
        <div className="luxury-card p-6 text-sm text-muted-foreground">
          No lines yet — the site is using the ones built into the code. Adding one here takes over.
        </div>
      )}

      <div className="space-y-2">
        {rows.map((a, i) => (
          <div key={a.id} className={cn("luxury-card p-3 flex items-center gap-3", !a.active && "opacity-50")}>
            <Input
              defaultValue={a.text}
              onBlur={(e) => saveText(a, e.target.value)}
              className="flex-1"
            />
            <div className="flex items-center gap-1 shrink-0">
              <IconBtn onClick={() => toggleActive(a)} title={a.active ? "Hide" : "Show"}>
                {a.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </IconBtn>
              <IconBtn onClick={() => move(i, -1)} disabled={i === 0 || busy}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => move(i, 1)} disabled={i === rows.length - 1 || busy}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => remove(a, `"${a.text}"`)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── collections ───────────────────────────────────────────────────────────── */

function CollectionsTab() {
  const { rows, loading, busy, load, move, remove, toggleActive } = useResource<any>("collections");
  const [editing, setEditing] = useState<any | null>(null);

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-muted-foreground">
          The "Shop by Collection" tiles on the homepage.
        </p>
        <Button variant="luxury" size="sm" onClick={() => setEditing({ __isNew: true, source: "repo", active: true, sub: [] })}>
          <Plus className="w-4 h-4 mr-2" /> New Collection
        </Button>
      </div>

      <div className="space-y-2">
        {rows.map((c, i) => (
          <div key={c.id} className={cn("luxury-card p-3 flex items-center gap-4", !c.active && "opacity-50")}>
            <div className="w-20 h-14 shrink-0 rounded-sm overflow-hidden bg-deep-brown">
              {(c.storage_key || c.url) && (
                <img src={resolveImage({ source: c.source, storageKey: c.storage_key, url: c.url })} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ivory">{c.title}</p>
              <p className="text-[11px] text-muted-foreground truncate">{c.blurb}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5">key: {c.key}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <IconBtn onClick={() => toggleActive(c)}>{c.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}</IconBtn>
              <IconBtn onClick={() => move(i, -1)} disabled={i === 0 || busy}><ArrowUp className="w-3.5 h-3.5" /></IconBtn>
              <IconBtn onClick={() => move(i, 1)} disabled={i === rows.length - 1 || busy}><ArrowDown className="w-3.5 h-3.5" /></IconBtn>
              <Button variant="outline-gold" size="sm" onClick={() => setEditing({ ...c })}>Edit</Button>
              <IconBtn onClick={() => remove(c, c.title)} danger><Trash2 className="w-3.5 h-3.5" /></IconBtn>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <CollectionEditor
          value={editing}
          onChange={setEditing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load(); }}
        />
      )}
    </div>
  );
}

function CollectionEditor({ value, onChange, onClose, onSaved }: any) {
  const [saving, setSaving] = useState(false);
  const set = (k: string, v: any) => onChange({ ...value, [k]: v });

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...value };
      delete payload.__isNew;
      delete payload.updated_at;
      if (value.__isNew) {
        delete payload.id;
        await adminApi.create("collections", payload);
      } else {
        const { id, ...fields } = payload;
        await adminApi.update("collections", id, fields);
      }
      toast.success("Saved");
      onSaved();
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={value.__isNew ? "New collection" : "Edit collection"} onClose={onClose}>
      <Labelled label="Key" hint="Must match a product category exactly — e.g. Perfume, Attar, Gift Set">
        <Input value={value.key ?? ""} onChange={(e) => set("key", e.target.value)} />
      </Labelled>
      <Labelled label="Title">
        <Input value={value.title ?? ""} onChange={(e) => set("title", e.target.value)} />
      </Labelled>
      <Labelled label="Blurb">
        <Input value={value.blurb ?? ""} onChange={(e) => set("blurb", e.target.value)} />
      </Labelled>
      <Labelled label="Tags" hint="Comma separated chips shown under the title">
        <Input
          value={(value.sub ?? []).join(", ")}
          onChange={(e) => set("sub", e.target.value.split(",").map((s: string) => s.trim()).filter(Boolean))}
        />
      </Labelled>
      <ImageField
        label="Tile image"
        source={value.source}
        storageKey={value.storage_key}
        url={value.url}
        onChange={(ref) => onChange({ ...value, source: ref.source, storage_key: ref.storageKey, url: ref.url })}
      />
      <ModalActions onClose={onClose} onSave={save} saving={saving} />
    </Modal>
  );
}

/* ── settings ──────────────────────────────────────────────────────────────── */

/** Settings the admin is expected to touch. Anything else in the table is still
 *  editable as raw JSON below, but these get a proper label and input. */
const KNOWN_SETTINGS: { key: string; label: string; hint?: string; type: "text" | "number" | "list" }[] = [
  { key: "delivery_estimate", label: "Delivery estimate", hint: "Shown under the Buy button. Keep it consistent with the Shipping Policy page.", type: "text" },
  { key: "trading_since", label: "Trading since (year)", hint: "Used by the trust line on the Collector's Edition page.", type: "number" },
  { key: "new_launch_slugs", label: "New Launches", hint: "Product slugs, comma separated. Drives the homepage strip and the shop filter.", type: "list" },
];

function SettingsTab() {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.list<any>("settings");
      const map: Record<string, any> = {};
      for (const s of data.settings ?? []) map[s.key] = s.value;
      setValues(map);
    } catch (err: any) {
      toast.error(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const save = async (key: string, value: unknown) => {
    setSavingKey(key);
    try {
      await adminApi.setSetting(key, value);
      toast.success("Saved");
      setValues((v) => ({ ...v, [key]: value }));
    } catch (err: any) {
      toast.error(err.message || "Save failed");
    } finally {
      setSavingKey(null);
    }
  };

  if (loading) return <Spinner />;

  return (
    <div className="space-y-4 max-w-2xl">
      {KNOWN_SETTINGS.map((s) => (
        <SettingRow
          key={s.key}
          def={s}
          value={values[s.key]}
          saving={savingKey === s.key}
          onSave={(v) => save(s.key, v)}
        />
      ))}
    </div>
  );
}

function SettingRow({ def, value, saving, onSave }: any) {
  const initial = def.type === "list" ? (Array.isArray(value) ? value.join(", ") : "") : String(value ?? "");
  const [draft, setDraft] = useState(initial);

  useEffect(() => { setDraft(initial); }, [initial]);

  const commit = () => {
    if (def.type === "list") {
      onSave(draft.split(",").map((s: string) => s.trim()).filter(Boolean));
    } else if (def.type === "number") {
      const n = Number(draft);
      if (!Number.isFinite(n)) { toast.error("Must be a number"); return; }
      onSave(n);
    } else {
      onSave(draft);
    }
  };

  return (
    <div className="luxury-card p-4 space-y-2">
      <p className="text-sm text-ivory">{def.label}</p>
      {def.hint && <p className="text-[11px] text-muted-foreground">{def.hint}</p>}
      <div className="flex gap-2">
        <Input value={draft} onChange={(e) => setDraft(e.target.value)} />
        <Button variant="outline-gold" onClick={commit} disabled={saving || draft === initial}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ── shared UI ─────────────────────────────────────────────────────────────── */

function IconBtn({ children, onClick, disabled, danger, title }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        "w-8 h-8 rounded-sm border border-border flex items-center justify-center text-muted-foreground transition-colors disabled:opacity-30",
        danger ? "hover:text-destructive hover:border-destructive/50" : "hover:text-primary hover:border-primary/50"
      )}
    >
      {children}
    </button>
  );
}

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm overflow-y-auto">
      <div className="min-h-full flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-xl luxury-card p-5 sm:p-7 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl text-ivory">{title}</h2>
            <button onClick={onClose} className="text-muted-foreground hover:text-ivory">
              <X className="w-5 h-5" />
            </button>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

function ModalActions({ onClose, onSave, saving }: any) {
  return (
    <div className="flex justify-end gap-3 border-t border-border pt-4">
      <Button variant="ghostGold" onClick={onClose}>Cancel</Button>
      <Button variant="luxury" onClick={onSave} disabled={saving}>
        {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
        Save
      </Button>
    </div>
  );
}

function Labelled({ label, hint, children }: any) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-[10px] text-muted-foreground/70">{hint}</span>}
    </label>
  );
}

/** Image chooser shared by banners and collections: upload a new file, or reuse one
 *  of the photos already committed to the repo (free to serve, no upload needed). */
function ImageField({ label, hint, source, storageKey, url, onChange }: any) {
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [q, setQ] = useState("");

  const matches = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return (needle ? repoImageKeys.filter((k) => k.toLowerCase().includes(needle)) : repoImageKeys).slice(0, 60);
  }, [q]);

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    try {
      const uploaded = await adminApi.uploadImage(file);
      onChange({ source: "cloudinary", storageKey: null, url: uploaded });
      toast.success("Uploaded");
    } catch (err: any) {
      toast.error(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const has = Boolean(storageKey || url);

  return (
    <div className="space-y-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {hint && <span className="block text-[10px] text-muted-foreground/70">{hint}</span>}
      <div className="flex items-start gap-3">
        <div className="w-32 h-20 rounded-sm overflow-hidden bg-deep-brown border border-border shrink-0">
          {has && <img src={resolveImage({ source, storageKey, url })} alt="" className="w-full h-full object-cover" />}
        </div>
        <div className="flex flex-col gap-2">
          <Button variant="outline-gold" size="sm" onClick={() => setPicking((v) => !v)}>
            {picking ? "Close" : "Pick existing"}
          </Button>
          <label>
            <Button variant="luxury" size="sm" disabled={busy} asChild>
              <span className="cursor-pointer">
                {busy ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <ImagePlus className="w-3.5 h-3.5 mr-1.5" />}
                Upload
              </span>
            </Button>
            <input type="file" accept="image/*" hidden onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
          </label>
        </div>
      </div>

      {picking && (
        <div className="space-y-2 border border-border rounded-sm p-3">
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search photos…" autoFocus />
          <div className="grid grid-cols-5 gap-2 max-h-56 overflow-y-auto">
            {matches.map((key) => (
              <button
                key={key}
                title={key}
                onClick={() => { onChange({ source: "repo", storageKey: key, url: null }); setPicking(false); }}
                className="rounded-sm overflow-hidden border border-border hover:border-primary"
              >
                <img src={resolveImage({ source: "repo", storageKey: key })} alt="" loading="lazy" className="w-full aspect-square object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Miniature of how the banner will actually render, desktop and mobile side by side.
 *
 * The two are genuinely different layouts, not one image at two sizes: desktop draws the
 * eyebrow/headline/second line over wide artwork in HTML, while mobile shows tall artwork
 * with its copy already baked in and only a button on top. Without seeing both, it is not
 * obvious why the text fields appear to do nothing on a phone.
 */
function BannerPreview({ value }: { value: any }) {
  const hasDesktop = Boolean(value.storage_key || value.url);
  const hasMobile = Boolean(value.mobile_storage_key || value.mobile_url);

  const desktopSrc = resolveImage({ source: value.source, storageKey: value.storage_key, url: value.url });
  const mobileSrc = hasMobile
    ? resolveImage({ source: value.mobile_source, storageKey: value.mobile_storage_key, url: value.mobile_url })
    : desktopSrc;

  return (
    <div className="space-y-2">
      <p className="text-[10px] tracking-luxe uppercase text-primary">Preview</p>
      <div className="flex gap-3">
        {/* Desktop */}
        <div className="flex-1 min-w-0">
          <div className="relative aspect-[16/7] rounded-sm overflow-hidden bg-deep-brown border border-border">
            {hasDesktop && <img src={desktopSrc} alt="" className="absolute inset-0 w-full h-full object-cover" />}
            <div className="absolute inset-0 bg-gradient-to-r from-background/85 to-transparent" />
            <div className="absolute inset-0 flex flex-col justify-center px-3">
              {value.eyebrow && (
                <p className="text-[6px] tracking-[0.3em] uppercase text-primary truncate">{value.eyebrow}</p>
              )}
              <p className="font-display text-[13px] text-ivory leading-tight truncate">
                {value.headline || "Headline"}
              </p>
              {value.highlight && (
                <p className="font-serif italic text-[11px] text-gold leading-tight truncate">{value.highlight}</p>
              )}
              {value.cta_label && (
                <span className="mt-1 inline-block w-fit bg-gradient-gold text-primary-foreground text-[6px] px-1.5 py-0.5 rounded-sm">
                  {value.cta_label}
                </span>
              )}
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">Desktop</p>
        </div>

        {/* Mobile */}
        <div className="w-[74px] shrink-0">
          <div className="relative aspect-[9/16] rounded-sm overflow-hidden bg-deep-brown border border-border">
            {(hasMobile || hasDesktop) && (
              <img
                src={mobileSrc}
                alt=""
                className={cn(
                  "absolute inset-0 w-full h-full",
                  value.mobile_fit === "contain" ? "object-contain" : "object-cover"
                )}
              />
            )}
            {value.cta_label && (
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 border border-primary text-primary text-[5px] px-1 py-0.5 rounded-sm bg-background/70 whitespace-nowrap">
                {value.cta_label}
              </span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 text-center">
            {hasMobile ? "Mobile" : "Mobile (desktop art)"}
          </p>
        </div>
      </div>
    </div>
  );
}
