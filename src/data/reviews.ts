import { Product } from "./products";

/**
 * Seed reviews shown on a product page before any real customer reviews exist.
 * Deterministic per product (same product always shows the same 3), so it doesn't
 * reshuffle on every render/refresh, but varies across products by folding the
 * product's own name/notes/mood/occasion into the text instead of one fixed
 * paragraph reused everywhere.
 */

const REVIEWERS = [
  "Aisha M.", "Rohan K.", "Priya S.", "Karan V.", "Neha T.",
  "Arjun R.", "Simran K.", "Vikram S.", "Ananya D.", "Farhan A.",
];

const TEMPLATES: Array<(p: Product, note: string, mood: string, occasion: string) => string> = [
  (p, note) => `${p.name} is stunning — the ${note} really comes through and the longevity is unreal. Compliments all day.`,
  (p, note) => `Worth every rupee. ${p.name} opens with ${note} and settles into something I keep reaching for.`,
  (p, _n, mood) => `My new signature scent. ${p.name} feels ${mood.toLowerCase()} and sophisticated — exactly what I wanted.`,
  (p, _n, _m, occasion) => `Perfect for ${occasion.toLowerCase()}. ${p.name} gets noticed without being loud.`,
  (p, note) => `The ${note} note in ${p.name} is beautifully done. The packaging alone feels like a gift.`,
  (p) => `${p.name} has become my go-to. Subtle, addictive, and it lasts the whole day.`,
];

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function seedReviewsFor(product: Product) {
  const h = hashCode(product.id);
  const allNotes = [...product.notes.top, ...product.notes.heart, ...product.notes.base];
  const note = (allNotes[h % allNotes.length] || product.category).toLowerCase();
  const mood = product.moods[(h >> 4) % (product.moods.length || 1)] || "confident";
  const occasion = product.occasions[(h >> 8) % (product.occasions.length || 1)] || "everyday wear";

  // Deterministic ordering per product so the same 3 (distinct) templates are
  // picked every time, but the pick differs from one product to the next.
  const order = TEMPLATES.map((_, i) => i).sort(
    (a, b) => ((h + a * 13) % 97) - ((h + b * 13) % 97)
  );

  return order.slice(0, 3).map((templateIndex, i) => ({
    name: REVIEWERS[(h + i * 7) % REVIEWERS.length],
    rating: 5,
    text: TEMPLATES[templateIndex](product, note, mood, occasion),
  }));
}
