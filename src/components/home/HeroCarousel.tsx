import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Award, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import banner1 from "@/assets/brand/banner-1.jpg";
import banner2 from "@/assets/brand/banner-2.jpg";
import banner3 from "@/assets/brand/banner-4-collectors.png";
import mobileBannerMain from "@/assets/brand/mobile-banner-main.jpg";
import mobileBannerCelebrity from "@/assets/brand/mobile-banner-celebrity.jpg";
import mobileBannerAttar from "@/assets/brand/mobile-banner-attar.jpg";

const AUTOPLAY_MS = 5000;

// Trust stats shown under the hero copy (inline on desktop) and as a bordered,
// icon-led strip below the banner image on mobile — see the boxed stats block
// further down for the mobile version.
const heroStats = [
  { Icon: Award, v: "50K+", l: "Happy Customers" },
  { Icon: Star, v: "4.9", l: "Avg Rating" },
  { Icon: ShieldCheck, v: "100%", l: "Cruelty-Free" },
];

type Slide = {
  image: string;
  eyebrow: string;
  title: string;
  highlight: string;
  copy: string;
  cta: { label: string; to: string };
};

// EDIT: swap images/copy here whenever the current promo banners change — everything
// else (autoplay, dots, swipe, arrows) keeps working without touching the markup below.
const slides: Slide[] = [
  {
    image: banner1,
    eyebrow: "Red-Carpet Ready",
    title: "Celebrity",
    highlight: "Eau de Parfum",
    copy: "Made to be noticed — a luminous, spicy-sweet signature of bergamot, jasmine and amber that leaves a trail of compliments wherever you go.",
    cta: { label: "Shop Celebrity", to: "/product/celebrity" },
  },
  {
    image: banner2,
    eyebrow: "The Full Line",
    title: "The Attar",
    highlight: "Collection",
    copy: "Firdaus, Tulsi, Ruh-Kewra, Mogra Gold, Inayat and more — pure, alcohol-free attars hand-distilled in Kannauj for a scent that lasts all day.",
    cta: { label: "Shop the Attar Collection", to: "/shop?category=Attar" },
  },
  {
    image: banner3,
    eyebrow: "Three Stories. One Legacy of Fragrance.",
    title: "The Collector's",
    highlight: "Edition",
    copy: "Shabd, Kahani and Ehsaas — our 100ml Extrait de Parfum trilogy, crafted for those who collect meaning as much as scent.",
    cta: { label: "Explore the Trilogy", to: "/shop?category=Collector's Edition" },
  },
];

// Mobile gets its own swipeable banner set — each image already has its title/copy
// baked into the artwork, so a slide only needs the photo + alt text + one CTA.
// EDIT: add/remove entries here whenever the mobile banner set changes.
type MobileSlide = { image: string; alt: string; cta: { label: string; to: string } };

const mobileSlides: MobileSlide[] = [
  { image: mobileBannerCelebrity, alt: "Celebrity — Made to Be Remembered", cta: { label: "Shop Celebrity", to: "/product/celebrity" } },
  { image: mobileBannerAttar, alt: "The Attar Atelier — Heritage Edit", cta: { label: "Shop the Attar Collection", to: "/shop?category=Attar" } },
  { image: mobileBannerMain, alt: "The Collector's Edition — Shabd, Kahani & Ehsaas", cta: { label: "Explore the Trilogy", to: "/shop?category=Collector's Edition" } },
];

export function HeroCarousel() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [selected, setSelected] = useState(0);
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scrollTo = useCallback((i: number) => emblaApi?.scrollTo(i), [emblaApi]);
  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelected(emblaApi.selectedScrollSnap());
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi]);

  // Auto-advance every 5s; pauses on hover/focus and respects reduced-motion preference.
  useEffect(() => {
    if (!emblaApi) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || paused) return;
    timerRef.current = setInterval(() => emblaApi.scrollNext(), AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [emblaApi, paused]);

  // Separate embla instance for the mobile banner set (swipeable, autoplay, dots —
  // same behavior as the desktop carousel above, just its own state/instance).
  const [mEmblaRef, mEmblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [mSelected, setMSelected] = useState(0);
  const mScrollTo = useCallback((i: number) => mEmblaApi?.scrollTo(i), [mEmblaApi]);

  useEffect(() => {
    if (!mEmblaApi) return;
    const onSelect = () => setMSelected(mEmblaApi.selectedScrollSnap());
    mEmblaApi.on("select", onSelect);
    onSelect();
    return () => { mEmblaApi.off("select", onSelect); };
  }, [mEmblaApi]);

  useEffect(() => {
    if (!mEmblaApi) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;
    const t = setInterval(() => mEmblaApi.scrollNext(), AUTOPLAY_MS);
    return () => clearInterval(t);
  }, [mEmblaApi]);

  return (
    <>
    {/* Mobile-only banner carousel — each image already has its title/copy baked
        into the artwork, so every slide is just the photo with a per-slide CTA
        pinned near the bottom, no text overlay. Desktop keeps its separate 3-up
        carousel below (hidden on this breakpoint). */}
    <section className="sm:hidden relative overflow-hidden min-h-[600px] noise-overlay">
      <div className="overflow-hidden h-full" ref={mEmblaRef}>
        <div className="flex h-full">
          {mobileSlides.map((s, i) => (
            <div key={s.image} className="relative flex-[0_0_100%] min-h-[600px] flex items-end justify-center pb-14 px-6" aria-hidden={mSelected !== i}>
              <img
                src={s.image}
                alt={s.alt}
                className="absolute inset-0 w-full h-full object-cover -z-10"
                loading={i === 0 ? "eager" : "lazy"}
              />
              {/* Just enough of a bottom scrim to keep the button legible over the photo. */}
              <div className="absolute inset-x-0 bottom-0 h-[30%] bg-gradient-to-t from-background/85 via-background/35 to-transparent -z-10" />
              <Button asChild variant="outline-gold" size="lg">
                <Link to={s.cta.to}>{s.cta.label} →</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {mobileSlides.map((s, i) => (
          <button
            key={s.image}
            onClick={() => mScrollTo(i)}
            aria-label={`Go to mobile banner ${i + 1}`}
            aria-current={mSelected === i}
            className={`h-1.5 rounded-full transition-all duration-500 ${mSelected === i ? "w-6 bg-primary" : "w-1.5 bg-border"}`}
          />
        ))}
      </div>
    </section>

    <section
      className="hidden sm:flex relative items-center pt-28 pb-14 lg:pt-10 lg:pb-0 min-h-[640px] lg:min-h-screen noise-overlay overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured collections"
    >
      <div className="absolute inset-0 -z-10" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((s, i) => (
            <div key={s.title} className="relative flex-[0_0_100%] h-full" aria-hidden={selected !== i}>
              <img
                src={s.image}
                alt={`${s.title} ${s.highlight}`}
                className="w-full h-full object-cover object-center lg:object-[70%_center] opacity-80 lg:opacity-90"
                loading={i === 0 ? "eager" : "lazy"}
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20 lg:from-background lg:via-transparent lg:to-transparent" />
            </div>
          ))}
        </div>
      </div>

      <div className="container relative grid lg:grid-cols-2 gap-10 items-center py-6 lg:py-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.7 }}
            className="space-y-5 sm:space-y-8 max-w-xl bg-background/50 backdrop-blur-sm rounded-sm p-5 sm:p-0 sm:bg-transparent sm:backdrop-blur-none"
          >
            <div className="flex items-center gap-3">
              <span className="h-px w-12 bg-primary" />
              <span className="text-[10px] tracking-[0.5em] uppercase text-primary">{slides[selected].eyebrow}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl xl:text-7xl leading-[0.98] text-ivory">
              {slides[selected].title}
              <span className="block italic font-serif text-gold mt-2">{slides[selected].highlight}</span>
            </h1>
            <span className="h-px w-12 bg-primary block" />
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
              {slides[selected].copy}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <Button asChild variant="luxury" size="lg" className="w-full sm:w-auto sm:h-12 sm:px-8 sm:text-base"><Link to={slides[selected].cta.to}>{slides[selected].cta.label}</Link></Button>
              <Button asChild variant="outline-gold" size="lg" className="w-full sm:w-auto sm:h-12 sm:px-8 sm:text-base"><Link to="/shop">View All Fragrances</Link></Button>
            </div>
            {/* Desktop/tablet: stats stay inline with the copy. Mobile version renders
                as a separate bordered strip below the banner (see below). */}
            <div className="hidden sm:flex items-center gap-8 pt-6">
              {heroStats.map((s) => (
                <div key={s.l}>
                  <p className="font-display text-2xl text-gold">{s.v}{s.l === "Avg Rating" ? "★" : ""}</p>
                  <p className="text-[10px] tracking-luxe uppercase text-muted-foreground">{s.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Arrows */}
      <button
        onClick={scrollPrev} aria-label="Previous banner"
        className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur text-ivory/80 hover:text-primary hover:border-primary transition-colors"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext} aria-label="Next banner"
        className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 items-center justify-center rounded-full border border-border/60 bg-background/40 backdrop-blur text-ivory/80 hover:text-primary hover:border-primary transition-colors"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        {slides.map((s, i) => (
          <button
            key={s.title}
            onClick={() => scrollTo(i)}
            aria-label={`Go to banner ${i + 1}`}
            aria-current={selected === i}
            className={`h-1.5 rounded-full transition-all duration-500 ${selected === i ? "w-8 bg-primary" : "w-1.5 bg-border hover:bg-primary/50"}`}
          />
        ))}
      </div>

      <div className="hidden lg:block absolute bottom-8 left-1/2 -translate-x-1/2 text-[10px] tracking-luxe uppercase text-muted-foreground animate-pulse">
        Scroll to discover
      </div>
    </section>

    {/* Mobile-only trust strip — bordered box with icon-led stats, sitting on the
        page background just below the banner (matches the reference mobile layout).
        Desktop keeps the inline version inside the hero copy above. */}
    <div className="sm:hidden container -mt-8 relative z-10">
      <div className="luxury-card grid grid-cols-3 divide-x divide-border/60 py-4">
        {heroStats.map((s) => (
          <div key={s.l} className="flex flex-col items-center gap-1.5 px-1 text-center">
            <s.Icon className="w-5 h-5 text-primary" strokeWidth={1.2} />
            <p className="font-display text-lg text-gold">{s.v}{s.l === "Avg Rating" ? "★" : ""}</p>
            <p className="text-[9px] tracking-luxe uppercase text-muted-foreground leading-tight">{s.l}</p>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
