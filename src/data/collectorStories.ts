// Image sets for the full-bleed Collector's Edition editorial stories (one per bottle).
// Each product's images are a self-contained composed panel with copy baked into the
// artwork (except `packaging`, a plain photo that gets an HTML caption). Roles are
// assigned per image here because the source numbering isn't consistent between
// products — e.g. Kahani's heart-note card is #7 while Shabd's & Ehsaas's is #6.

import k1 from "@/assets/kahani/k1.jpg";
import k2 from "@/assets/kahani/k2.jpg";
import k3 from "@/assets/kahani/k3.jpg";
import k4 from "@/assets/kahani/k4.jpg";
import k5 from "@/assets/kahani/k5.jpg";
import k6 from "@/assets/kahani/k6.jpg";
import k7 from "@/assets/kahani/k7.jpg";
import k8 from "@/assets/kahani/k8.jpg";

import e1 from "@/assets/ehsaas/e1.jpg";
import e2 from "@/assets/ehsaas/e2.jpg";
import e3 from "@/assets/ehsaas/e3.jpg";
import e4 from "@/assets/ehsaas/e4.jpg";
import e5 from "@/assets/ehsaas/e5.jpg";
import e6 from "@/assets/ehsaas/e6.jpg";
import e7 from "@/assets/ehsaas/e7.jpg";
import e8 from "@/assets/ehsaas/e8.jpg";

import s1 from "@/assets/shabd/s1.jpg";
import s2 from "@/assets/shabd/s2.jpg";
import s3 from "@/assets/shabd/s3.jpg";
import s4 from "@/assets/shabd/s4.jpg";
import s5 from "@/assets/shabd/s5.jpg";
import s6 from "@/assets/shabd/s6.jpg";
import s7 from "@/assets/shabd/s7.jpg";
import s8 from "@/assets/shabd/s8.jpg";

export type StoryImages = {
  hero: string;       // opening — Three Fragrances. One Legacy.
  story: string;      // Every Story Leaves a Trace
  notesTop: string;   // top-notes card
  notesHeart: string; // heart-notes card
  notesBase: string;  // base-notes card
  packaging: string;  // plain box + bottle photo (no baked copy)
  lifestyle: string;  // portrait poster
  closing: string;    // Introducing <name> — Woven. Warm. Timeless.
};

/** Keyed by product slug. Present only for products that have an editorial story. */
export const collectorStories: Record<string, StoryImages> = {
  kahani: { hero: k8, story: k4, notesTop: k5, notesHeart: k7, notesBase: k6, packaging: k3, lifestyle: k2, closing: k1 },
  ehsaas: { hero: e8, story: e4, notesTop: e5, notesHeart: e6, notesBase: e7, packaging: e3, lifestyle: e2, closing: e1 },
  shabd:  { hero: s8, story: s4, notesTop: s5, notesHeart: s6, notesBase: s7, packaging: s3, lifestyle: s2, closing: s1 },
};
