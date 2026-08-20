/**
 * Catalogue access for the storefront.
 *
 * Serves the bundled snapshot (src/data/products.ts) immediately, then revalidates
 * against Supabase in the background and swaps in live data when it arrives. So an
 * admin edit shows up on the next page load without a redeploy, while first paint
 * still costs zero network round trips and a database outage degrades to the
 * snapshot instead of an empty shop.
 *
 * Components import from here instead of reaching into @/data/products for catalogue
 * *data*. The pure helpers there (priceFor, imageFor, listingVolume, …) operate on a
 * Product you already hold and are unaffected — keep importing those directly.
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  products as snapshotProducts,
  collections as snapshotCollections,
  NEW_LAUNCH_SLUGS,
  type Product,
} from "@/data/products";
import { fetchCatalog, type Catalog, type Collection, type Banner } from "@/lib/catalog";

const SNAPSHOT: Catalog = {
  products: snapshotProducts,
  collections: snapshotCollections.map((c) => ({
    key: c.key,
    title: c.title,
    blurb: c.blurb,
    sub: [...c.sub],
  })),
  // Hero art and announcement copy stay with their components until live rows exist,
  // so an empty database changes nothing about how the homepage renders.
  banners: [],
  announcements: [],
  newLaunchSlugs: [...NEW_LAUNCH_SLUGS],
  settings: {},
  origin: "snapshot",
};

type CatalogCtx = Catalog & {
  getProduct: (slug: string) => Product | undefined;
  productById: (id: string) => Product | undefined;
  amazonChoiceProducts: Product[];
  isLive: boolean;
};

const Ctx = createContext<CatalogCtx | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const { data } = useQuery({
    queryKey: ["catalog"],
    queryFn: fetchCatalog,
    // Deliberately NO initialData. React Query treats initialData as data that was
    // just fetched, so pairing it with a staleTime marks the query fresh on mount and
    // skips the fetch entirely — the snapshot would render forever and admin edits
    // would never appear. `data` is simply undefined until the fetch resolves, and the
    // `data ?? SNAPSHOT` below covers that first paint just as well.
    //
    // Catalogue edits are infrequent, so a minute of staleness is invisible to
    // shoppers while still keeping route changes from refetching.
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const value = useMemo<CatalogCtx>(() => {
    const catalog: Catalog = data ?? SNAPSHOT;

    // Live rows win per-section: seeding products first shouldn't blank the
    // announcement bar just because that table is still empty.
    const merged: Catalog = {
      ...catalog,
      collections: catalog.collections.length ? catalog.collections : SNAPSHOT.collections,
      newLaunchSlugs: catalog.newLaunchSlugs.length ? catalog.newLaunchSlugs : SNAPSHOT.newLaunchSlugs,
    };

    const bySlug = new Map(merged.products.map((p) => [p.slug, p]));
    const byId = new Map(merged.products.map((p) => [p.id, p]));

    return {
      ...merged,
      getProduct: (slug) => bySlug.get(slug),
      productById: (id) => byId.get(id),
      amazonChoiceProducts: merged.products.filter((p) => p.amazonChoice),
      isLive: merged.origin === "database",
    };
  }, [data]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog(): CatalogCtx {
  const ctx = useContext(Ctx);
  // Falling back instead of throwing keeps anything rendered outside the provider
  // (an error boundary's fallback, a stray portal) from turning a missing provider
  // into a blank page.
  if (!ctx) {
    const bySlug = new Map(SNAPSHOT.products.map((p) => [p.slug, p]));
    const byId = new Map(SNAPSHOT.products.map((p) => [p.id, p]));
    return {
      ...SNAPSHOT,
      getProduct: (slug) => bySlug.get(slug),
      productById: (id) => byId.get(id),
      amazonChoiceProducts: SNAPSHOT.products.filter((p) => p.amazonChoice),
      isLive: false,
    };
  }
  return ctx;
}

export type { Collection, Banner };
