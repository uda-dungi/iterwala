import { ShieldCheck } from "lucide-react";
import { StoryImages } from "@/data/collectorStories";
import { TRADING_SINCE } from "@/config/site";

/**
 * Full-bleed editorial story for a Collector's Edition bottle (Shabd / Kahani / Ehsaas).
 * Every panel is a self-contained composed image with its copy baked into the artwork,
 * except `packaging`, the plain photo, which gets an HTML caption. Panels flow
 * top-to-bottom and are all `w-full h-auto`, so nothing is ever cropped — they simply
 * scale to the screen width on mobile and desktop.
 */
export function CollectorStory({ images, name }: { images: StoryImages; name: string }) {
  return (
    <section className="w-full">
      {/* 1 · Opening hero */}
      <img src={images.hero} alt="Itrawala Collector's Edition — Three Fragrances, One Legacy" className="block w-full h-auto" loading="lazy" />

      {/* 2 · Trust line. Sits directly under the opening hero so the credibility claim
          frames everything below it, and is the one band on this page with a gold
          background — the surrounding panels are all dark artwork, so it reads as a
          deliberate highlight rather than another slide. */}
      <div className="bg-gradient-gold text-primary-foreground">
        <div className="container py-4 md:py-5 flex items-center justify-center gap-3 md:gap-4 text-center">
          <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 shrink-0" strokeWidth={1.5} />
          <p className="font-serif text-base sm:text-xl md:text-2xl tracking-wide">
            Trusted by online customers since {TRADING_SINCE}
          </p>
        </div>
      </div>

      {/* 3 · The story */}
      <img src={images.story} alt={`${name} — Every Story Leaves a Trace`} className="block w-full h-auto" loading="lazy" />

      {/* 4 · Fragrance notes — three square cards (3-up on desktop, stacked on mobile) */}
      <div className="py-10 md:py-16">
        <div className="text-center mb-6 md:mb-10 px-4">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Fragrance Notes</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ivory mt-2">A Symphony of Notes</h2>
          <div className="gold-divider w-24 mx-auto mt-4" />
        </div>
        <div className="grid md:grid-cols-3 gap-1.5 md:gap-3 max-w-[1600px] mx-auto md:px-3">
          <img src={images.notesTop} alt={`${name} top notes`} className="block w-full h-auto" loading="lazy" />
          <img src={images.notesHeart} alt={`${name} heart notes`} className="block w-full h-auto" loading="lazy" />
          <img src={images.notesBase} alt={`${name} base notes`} className="block w-full h-auto" loading="lazy" />
        </div>
      </div>

      {/* 5 · Packaging — the one photo without baked copy, paired with an HTML caption */}
      <div className="grid md:grid-cols-2 items-center">
        <img src={images.packaging} alt={`${name} Collector's Edition packaging`} className="block w-full h-auto order-1 md:order-none" loading="lazy" />
        <div className="px-6 py-10 md:px-12 lg:px-16 text-center md:text-left">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Packaging</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-4xl text-ivory mt-2">A Collector's Keepsake</h2>
          <div className="gold-divider w-20 mx-auto md:mx-0 mt-4 mb-5" />
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed max-w-md mx-auto md:mx-0">
            Presented in a specially designed Collector's Edition box — made to be kept, cherished, and remembered long after the last drop.
          </p>
        </div>
      </div>

      {/* 6 · Lifestyle poster (portrait). A blurred, dimmed copy of the same image fills
          the full-width band behind it, so the wide desktop section reads as a framed
          moment instead of an empty void around a small centered poster. */}
      <div className="relative flex justify-center overflow-hidden py-10 md:py-16 px-4">
        <img
          src={images.lifestyle}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl"
        />
        <div className="absolute inset-0 bg-background/55" />
        <img
          src={images.lifestyle}
          alt={`${name} Collector's Edition`}
          className="relative block w-full max-w-sm md:max-w-md h-auto rounded-sm shadow-2xl"
          loading="lazy"
        />
      </div>

      {/* 7 · Closing */}
      <img src={images.closing} alt={`Introducing ${name} — Woven. Warm. Timeless.`} className="block w-full h-auto" loading="lazy" />
    </section>
  );
}
