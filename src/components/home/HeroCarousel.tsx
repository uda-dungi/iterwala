import { useCallback, useEffect, useRef, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Award, Star, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCatalog } from "@/store/catalog";
import banner1 from "@/assets/brand/banner-1.jpg";
import banner2 from "@/assets/brand/banner-2.jpg";
import mobileBannerCelebrity from "@/assets/brand/mobile-banner-celebrity-full.jpg";
import mobileBannerAttar from "@/assets/brand/mobile-banner-attar-full.jpg";
// Current promo set (Sep 2026), replacing the Janmashtami banners now that the festival
// has passed. Two campaigns, each shot twice: 16:9 for desktop and 9:16 for mobile, the
// exact aspects the two carousels below render at. The desktop pair keeps its left third
// clear because the copy is overlaid there; the mobile pair has its headline, offer and
// price baked into the artwork, so those slides carry no text of their own.
import bannerCollectorsPc from "@/assets/brand/banner-collectors-pc.jpg";
import bannerGiftSetPc from "@/assets/brand/banner-giftset-pc.jpg";
import bannerCollectorsMobile from "@/assets/brand/banner-collectors-mobile.jpg";
import bannerGiftSetMobile from "@/assets/brand/banner-giftset-mobile.jpg";
import bannerKarwaChauthPc from "@/assets/brand/banner-karwachauth-pc.jpg";
import bannerKarwaChauthMobile from "@/assets/brand/banner-karwachauth-mobile.jpg";

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
const fallbackSlides: Slide[] = [
  // Live promo banners first, so the current offers are what loads.
  // (Sep 2026: replaced the Janmashtami set once that festival passed. The offers
  // themselves are unchanged — the artwork just no longer names a festival, so it does
  // not go stale the moment the date does.)
  {
    image: bannerKarwaChauthPc,
    eyebrow: "No flowers. No chocolates.",
    title: "Karwa Chauth Sale",
    highlight: "Buy Any 2 Fragrances, Get 1 Free",
    copy: "Just a fragrance that says forever. Minimum order ₹999.",
    cta: { label: "Shop Now", to: "/shop" },
  },
  // HIDDEN (Oct 2026) — Collector's Edition promo; uncomment to bring it back.
  // {
  //   image: bannerCollectorsPc,
  //   eyebrow: "Where Every Bottle Tells a Story",
  //   title: "Collector's Edition",
  //   highlight: "Buy 2 Get 1 Free",
  //   copy: "Shabd, Kahani and Ehsaas — our 100ml Extrait de Parfum trilogy. Mix and match any three you love.",
  //   cta: { label: "Shop Trilogy", to: "/product/shabd" },
  // },
  // HIDDEN (Oct 2026) — Gift Set promo; uncomment to bring it back.
  // {
  //   image: bannerGiftSetPc,
  //   eyebrow: "A Fragrance For Every Mood",
  //   title: "Perfume Gift Sets",
  //   highlight: "Buy 1 Get 1 Free",
  //   copy: "Pack of 4 or Pack of 8, boxed and ready to give — add two and pay just ₹999 for both.",
  //   cta: { label: "Shop Gift Sets", to: "/shop?category=Gift Set" },
  // },
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
];

// Mobile gets its own swipeable banner set — each image already has its title/copy
// baked into the artwork, so a slide only needs the photo + alt text + one CTA.
// EDIT: add/remove entries here whenever the mobile banner set changes.
type MobileSlide = { image: string; alt: string; cta: { label: string; to: string }; fit?: "cover" | "contain" };

const fallbackMobileSlides: MobileSlide[] = [
  // Shot at 9:16, exactly this carousel's aspect, so object-cover shows them edge to
  // edge with nothing cropped — the offer headline and price sit near the top of the
  // artwork, which is precisely what a shorter frame used to cut off.
  { image: bannerKarwaChauthMobile, alt: "Karwa Chauth Sale — Buy Any 2 Fragrances, Get 1 Free, min order ₹999", fit: "cover", cta: { label: "Shop Now", to: "/shop" } },
  // HIDDEN (Oct 2026) { image: bannerCollectorsMobile, alt: "Collector's Edition trilogy — Buy 2 Get 1 Free", fit: "cover", cta: { label: "Shop Trilogy", to: "/product/shabd" } },
  // HIDDEN (Oct 2026) { image: bannerGiftSetMobile, alt: "Perfume Gift Set Special — Pack of 4 or Pack of 8, Buy 1 Get 1 Free at ₹999", fit: "cover", cta: { label: "Shop Gift Sets", to: "/shop?category=Gift Set" } },
  // Older brand banners are 4:5. In a 9:16 frame object-cover would slice ~30% off each
  { image: mobileBannerCelebrity, alt: "Celebrity — Made to Be Remembered", fit: "contain", cta: { label: "Shop Celebrity", to: "/product/celebrity" } },
  { image: mobileBannerAttar, alt: "The Attar Atelier — Heritage Edit", fit: "contain", cta: { label: "Shop the Attar Collection", to: "/shop?category=Attar" } },
  
];

export function HeroCarousel() {
  // Banners created in the admin replace the compiled slides wholesale. Until one
  // exists the list above renders, so an empty table can't blank the homepage hero.
  const { banners } = useCatalog();
  const slides: Slide[] = banners.length
    ? banners.map((b) => ({
        image: b.image,
        eyebrow: b.eyebrow ?? "",
        title: b.headline ?? "",
        highlight: b.highlight ?? "",
        copy: b.subtext ?? "",
        cta: { label: b.ctaLabel ?? "Shop Now", to: b.ctaHref ?? "/shop" },
      }))
    : fallbackSlides;

  // Phones get their own artwork per banner, falling back to the desktop image when a
  // banner has no mobile art. The copy is baked into mobile artwork, so only the image
  // and the CTA carry over — the eyebrow/headline/subtext fields are desktop-only.
  const mobileSlides: MobileSlide[] = banners.length
    ? banners.map((b) => ({
        image: b.mobileImage ?? b.image,
        alt: b.headline ?? "Itrawala",
        fit: b.mobileFit,
        cta: { label: b.ctaLabel ?? "Shop Now", to: b.ctaHref ?? "/shop" },
      }))
    : fallbackMobileSlides;

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, duration: 28 });
  const [selected, setSelected] = useState(0);
  // Swapping in a shorter live banner list can leave `selected` past the end.
  const current = slides[Math.min(selected, slides.length - 1)] ?? slides[0];
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

  useEffect(() => {
    emblaApi?.reInit();
    setSelected(0);
  }, [emblaApi, slides.length]);

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
  // The desktop banners sit in a display:none section on phones, but an eager <img> in
  // there is still downloaded. Only give them a src when the desktop layout is active.
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia("(min-width: 640px)").matches);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)");
    const on = () => setIsDesktop(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  const mScrollTo = useCallback((i: number) => mEmblaApi?.scrollTo(i), [mEmblaApi]);

  useEffect(() => {
    if (!mEmblaApi) return;
    const onSelect = () => setMSelected(mEmblaApi.selectedScrollSnap());
    mEmblaApi.on("select", onSelect);
    onSelect();
    return () => { mEmblaApi.off("select", onSelect); };
  }, [mEmblaApi]);

  // Embla measures its slides once, so a changed banner count needs a reInit or the
  // dots and scroll bounds keep describing the previous list.
  useEffect(() => {
    mEmblaApi?.reInit();
    setMSelected(0);
  }, [mEmblaApi, mobileSlides.length]);

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
    {/* aspect-[9/16] matches the promo artwork exactly, so the offer headline and price
        at the top of each banner are never cropped — a fixed 600px height was shorter
        than 9:16 on most phones and sliced them off. */}
    <section className="sm:hidden relative overflow-hidden aspect-[9/16] noise-overlay">
      <div className="overflow-hidden h-full" ref={mEmblaRef}>
        <div className="flex h-full">
          {mobileSlides.map((s, i) => (
            <div key={s.image} className="relative flex-[0_0_100%] h-full flex items-end justify-center pb-14 px-6" aria-hidden={mSelected !== i}>
              <img
                src={i === 0 || Math.abs(mSelected - i) <= 1 ? s.image : undefined}
                alt={s.alt}
                className={`absolute inset-0 w-full h-full -z-10 ${s.fit === "contain" ? "object-contain" : "object-cover"}`}
                loading={i === 0 ? "eager" : "lazy"}
                decoding={i === 0 ? "sync" : "async"}
                fetchPriority={i === 0 ? "high" : undefined}
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
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 items-center gap-2 z-10 flex">
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
                src={isDesktop ? s.image : undefined}
                alt={`${s.title} ${s.highlight}`}
                className="w-full h-full object-cover object-center lg:object-[70%_center] opacity-80 lg:opacity-90"
                loading={i === 0 ? "eager" : "lazy"}
                fetchPriority={i === 0 ? "high" : undefined}
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
              <span className="text-[10px] tracking-[0.5em] uppercase text-primary">{current.eyebrow}</span>
            </div>
            <h1 className="font-display text-3xl sm:text-4xl md:text-6xl xl:text-7xl leading-[0.98] text-ivory">
              {current.title}
              <span className="block italic font-serif text-gold mt-2">{current.highlight}</span>
            </h1>
            <span className="h-px w-12 bg-primary block" />
            <p className="text-sm sm:text-base md:text-lg text-muted-foreground leading-relaxed max-w-md">
              {current.copy}
            </p>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4">
              <Button asChild variant="luxury" size="lg" className="w-full sm:w-auto sm:h-12 sm:px-8 sm:text-base"><Link to={current.cta.to}>{current.cta.label}</Link></Button>
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
      <div className="absolute bottom-4 sm:bottom-6 lg:bottom-20 left-1/2 -translate-x-1/2 items-center gap-2 z-10 flex">
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
