import { useEffect, useMemo } from "react";
import { Product } from "@/data/products";
import { site } from "@/config/site";

/** Injects a JSON-LD <script> into <head> and cleans it up on unmount.
 *
 *  `data` is an object literal built fresh on every render by the callers below, so it's
 *  a new reference every time even when its contents haven't changed. Keying the effect
 *  on `data` directly made it re-run (removing and recreating the <script> tag) on every
 *  single render of the page instead of only when the actual content changes — memoizing
 *  on its JSON string keeps `stableData`'s reference stable across renders with the same
 *  content. */
function useJsonLd(id: string, data: unknown) {
  const stableData = useMemo(() => data, [JSON.stringify(data)]);
  useEffect(() => {
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(stableData);
    return () => { el?.remove(); };
  }, [id, stableData]);
  return null;
}

/** Product + AggregateRating schema for a product detail page. */
export function ProductSchema({ product }: { product: Product }) {
  return useJsonLd("ld-product", {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    brand: { "@type": "Brand", name: site.brand },
    category: product.category,
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: product.price,
      availability: "https://schema.org/InStock",
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.rating,
      reviewCount: product.reviews,
    },
  });
}

/** Organization schema for the home page. */
export function OrganizationSchema() {
  return useJsonLd("ld-org", {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.brand,
    slogan: site.tagline,
    email: site.email,
    telephone: site.phone,
  });
}
