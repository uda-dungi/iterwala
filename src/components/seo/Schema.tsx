import { useEffect } from "react";
import { Product } from "@/data/products";
import { site } from "@/config/site";

/** Injects a JSON-LD <script> into <head> and cleans it up on unmount. */
function useJsonLd(id: string, data: unknown) {
  useEffect(() => {
    let el = document.getElementById(id) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.type = "application/ld+json";
      el.id = id;
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
    return () => { el?.remove(); };
  }, [id, data]);
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
