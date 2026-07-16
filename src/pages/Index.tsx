import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { ArrowRight, Award, Leaf, Sparkles, Truck, ShieldCheck, Heart, Star, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ProductCard } from "@/components/shop/ProductCard";
import { AmazonChoiceBadge } from "@/components/shop/AmazonChoiceBadge";
import { OrganizationSchema } from "@/components/seo/Schema";
import { HeroCarousel } from "@/components/home/HeroCarousel";
import { ReviewsCarousel } from "@/components/home/ReviewsCarousel";
import { products, collections, amazonChoiceProducts } from "@/data/products";
import { formatINR } from "@/store/shop";
import { site, isSet, instagramLink } from "@/config/site";
import { supabase } from "@/lib/supabase";
import collection from "@/assets/collection-attars.jpg";
import attarLineup from "@/assets/brand/attar-lineup.jpg";
import perfumeCollectionImg from "@/assets/products/celebrity-1.jpg";
import giftSetCollectionImg from "@/assets/products/giftset-discovery.jpg";

const collectionImg = [perfumeCollectionImg, collection, giftSetCollectionImg];

const whyChoose = [
  { Icon: Leaf, t: "Pure Ingredients", d: "Distilled in Kannauj from rose petals, oud, sandal — never synthetic shortcuts." },
  { Icon: Award, t: "Premium Oils", d: "Aged absolutes, naturally derived musks, French-grade alcohol bases." },
  { Icon: ShieldCheck, t: "Skin-Friendly", d: "Dermatologist-reviewed. Cruelty-free. Vegan-conscious blends." },
  { Icon: Sparkles, t: "Luxury Packaging", d: "Hand-wrapped boxes, magnetic closures, gold-foil details." },
];

const moods = ["Romantic", "Confident", "Mysterious", "Fresh", "Opulent", "Calm"];
const noteFamilies = [
  { name: "Oud & Wood", desc: "Smoky · Rich · Eternal", color: "from-amber-900 to-stone-950" },
  { name: "Rose & Floral", desc: "Petal · Soft · Luminous", color: "from-rose-900 to-stone-950" },
  { name: "Amber & Spice", desc: "Warm · Bold · Magnetic", color: "from-orange-900 to-stone-950" },
  { name: "Musk & Skin", desc: "Sensual · Quiet · Lasting", color: "from-stone-700 to-stone-950" },
];

export default function Index() {
  const bestSellers = products.filter(p => p.bestSeller);
  const attars = products.filter(p => p.category === "Attar");
  const newArrivals = products.filter(p => p.newArrival);
  const giftSets = products.filter(p => p.category === "Gift Set");
  const amazonPick = amazonChoiceProducts[0] ?? products[0];

  return (
    <div className="overflow-hidden">
      <OrganizationSchema />
      {/* HERO — auto-scrolling 3-banner carousel (swap images/copy in HeroCarousel.tsx) */}
      <HeroCarousel />

      {/* Trust strip — category ticker */}
      <section className="border-y border-border/60 bg-deep-brown/40">
        <div className="container py-4 md:py-6 overflow-hidden">
          <div className="flex gap-6 md:gap-16 whitespace-nowrap animate-marquee">
            {[...Array(2)].flatMap((_, k) =>
              ["Perfumes", "Attars", "Perfume Packs of 4", "Perfume Packs of 8", "Gift Sets", "Collector's Edition"]
                .map((b, i) => (
                  <span key={`${k}-${i}`} className="font-serif italic text-sm md:text-2xl text-muted-foreground/60 tracking-wide">
                    {b} <span className="text-primary mx-3 md:mx-8">✦</span>
                  </span>
                ))
            )}
          </div>
        </div>
      </section>

      {/* SHOP BY COLLECTION */}
      <Section eyebrow="Browse" title="Shop by Collection" subtitle="Find your category — perfumes, attars, or ready-to-gift sets." className="pt-8 pb-10 md:pt-12 md:pb-14">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
          {collections.map((c, i) => (
            <motion.div key={c.key}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={i === 2 ? "col-span-2 md:col-span-1" : ""}>
              <Link to={`/shop?category=${encodeURIComponent(c.key)}`}
                className="block luxury-card group overflow-hidden">
                <div className="relative aspect-[4/3] md:aspect-[3/2] overflow-hidden bg-deep-brown">
                  <img src={collectionImg[i % collectionImg.length]} alt={c.title}
                    className="w-full h-full object-cover opacity-70 transition-transform duration-[1.2s] group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-3 md:p-6">
                    <h3 className="font-display text-lg md:text-3xl text-ivory group-hover:text-primary transition-colors">{c.title}</h3>
                    <p className="hidden md:block text-sm text-muted-foreground mt-1">{c.blurb}</p>
                  </div>
                </div>
                <div className="hidden md:flex p-5 flex-wrap gap-2">
                  {c.sub.map(s => (
                    <span key={s} className="text-[11px] tracking-wide px-3 py-1 border border-border rounded-sm text-muted-foreground group-hover:border-primary/40">{s}</span>
                  ))}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* BEST SELLERS */}
      <Section eyebrow="Loved by Many" title="Best Sellers" subtitle="The fragrances our patrons return for, again and again." className="pt-2 pb-10 md:pt-4 md:pb-20">
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {bestSellers.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        <div className="sm:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {bestSellers.slice(0, 4).map((p, i) => (
            <div key={p.id} className="min-w-[78%] snap-start">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </Section>

      {/* WHY */}
      <Section eyebrow="The Itrawala Promise" title="Why Choose Itrawala">
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {whyChoose.map((f, i) => (
            <motion.div key={f.t}
              initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="luxury-card p-8 text-center">
              <f.Icon className="w-8 h-8 text-primary mx-auto mb-5" strokeWidth={1.2} />
              <h3 className="font-serif text-xl text-ivory mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </motion.div>
          ))}
        </div>
        <div className="md:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {whyChoose.map((f) => (
            <div key={f.t} className="min-w-[80%] snap-start luxury-card p-8 text-center">
              <f.Icon className="w-8 h-8 text-primary mx-auto mb-5" strokeWidth={1.2} />
              <h3 className="font-serif text-xl text-ivory mb-2">{f.t}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* NEW ARRIVALS */}
      <Section eyebrow="The Maison" title="New Arrivals" subtitle="A hand-picked edit from our perfumers — the scents defining the season.">
        <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {newArrivals.slice(0, 4).map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
        </div>
        <div className="sm:hidden -mx-4 px-4 flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2">
          {newArrivals.slice(0, 4).map((p, i) => (
            <div key={p.id} className="min-w-[78%] snap-start">
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </Section>

      {/* AMAZON'S CHOICE */}
      <section className="container py-10 md:py-20">
        <div className="luxury-card grid lg:grid-cols-2 gap-0 overflow-hidden">
          <div className="relative aspect-square lg:aspect-auto bg-deep-brown">
            <img src={amazonPick.image} alt={amazonPick.name} className="w-full h-full object-cover" />
            <div className="absolute top-5 left-5"><AmazonChoiceBadge className="text-xs px-3 py-1.5" /></div>
          </div>
          <div className="p-6 sm:p-10 md:p-14 flex flex-col justify-center">
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">🏆 Chosen by Amazon. Loved by Customers.</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-5xl text-ivory mt-3">{amazonPick.name}</h2>
            <p className="font-serif italic text-muted-foreground mt-1">{amazonPick.tagline}</p>
            <div className="flex items-center gap-1 mt-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.round(amazonPick.rating) ? "fill-primary text-primary" : "text-muted"}`} />
              ))}
              <span className="text-sm text-muted-foreground ml-1">{amazonPick.rating} · {amazonPick.reviews} reviews</span>
            </div>
            <p className="text-muted-foreground leading-relaxed mt-4 max-w-md">{amazonPick.description}</p>
            <p className="font-display text-3xl text-gold mt-5">{formatINR(amazonPick.price)}</p>
            <div className="flex flex-wrap gap-3 mt-6">
              <Button asChild variant="luxury" size="lg"><Link to={`/product/${amazonPick.slug}`}>Shop Now</Link></Button>
              {isSet(site.amazonStoreUrl) && (
                <Button asChild variant="outline-gold" size="lg">
                  <a href={site.amazonStoreUrl} target="_blank" rel="noopener noreferrer">View on Amazon</a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* STORYTELLING */}
      <section className="container py-10 md:py-20">
        <div className="luxury-card p-6 sm:p-10 md:p-16 text-center max-w-4xl mx-auto bg-gradient-to-br from-deep-brown to-background">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">About Itrawala</p>
          <h2 className="font-display text-2xl sm:text-3xl md:text-5xl text-ivory mt-3">Legacy of 25 Years</h2>
          <p className="font-serif text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mt-4 md:mt-6">
            Itra Wala invites you to explore a world where scent is a language of the soul, where
            attars and perfumes become a part of your identity. Indulge in the allure of fragrances
            that transcend time and space, igniting emotions and memories that linger long after the
            scent fades. Experience the journey of fragrance today.
          </p>
          <div className="flex items-center justify-center gap-6 sm:gap-10 mt-6 md:mt-8">
            <div>
              <p className="font-display text-2xl sm:text-4xl text-gold">400 K</p>
              <p className="text-[10px] sm:text-xs tracking-luxe uppercase text-muted-foreground mt-1">Perfumes Sold</p>
            </div>
            <div>
              <p className="font-display text-2xl sm:text-4xl text-gold">10 Years</p>
              <p className="text-[10px] sm:text-xs tracking-luxe uppercase text-muted-foreground mt-1">Perfect Years</p>
            </div>
          </div>
          <Button asChild variant="outline-gold" size="lg" className="mt-6 md:mt-8"><Link to="/about">Know Our Story</Link></Button>
        </div>
      </section>

      {/* ATTARS BANNER */}
      <section className="container py-10 md:py-20">
        <div className="relative grid lg:grid-cols-2 rounded-sm overflow-hidden border border-border/60 vignette min-h-[360px] sm:min-h-[420px] lg:min-h-[480px]">
          <div className="absolute inset-0 lg:relative lg:inset-auto">
            <img src={attarLineup} alt="Itrawala premium attar collection" className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/90 via-background/40 to-transparent lg:hidden" />
          </div>
          <div className="relative p-6 sm:p-10 md:p-16 flex flex-col justify-center bg-deep-brown/80 lg:bg-deep-brown/60">
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Heritage Edit</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-3 leading-tight">
              The Attar <span className="italic text-gold">Atelier</span>
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground mt-3 md:mt-5 max-w-md leading-relaxed">
              Alcohol-free. Concentrated. Hand-distilled in copper deg vessels using centuries-old Kannauj
              traditions. Wear a single drop and let the trail tell its story.
            </p>
            <div className="flex gap-4 mt-5 md:mt-8">
              <Button asChild variant="luxury" size="lg"><Link to="/shop?category=Attar">Shop Attars <ArrowRight className="ml-1" /></Link></Button>
            </div>
          </div>
        </div>
      </section>

      {/* SHOP BY MOOD */}
      <Section eyebrow="Wear Your Mood" title="Shop by Mood">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {moods.map((m, i) => (
            <motion.div key={m}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
              <Link to={`/shop?mood=${m}`}
                className="block group aspect-square border border-border rounded-sm bg-deep-brown/40 hover:border-primary transition-all hover:shadow-gold flex items-center justify-center text-center p-4 hover:-translate-y-1 duration-500">
                <span className="font-serif text-xl text-ivory group-hover:text-primary transition-colors">{m}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* NOTES EXPLORER — matches Shop by Mood's compact tile grid on mobile */}
      <Section eyebrow="The Library" title="Perfume Notes Explorer">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
          {noteFamilies.map((n, i) => (
            <motion.div key={n.name}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className={`luxury-card aspect-square lg:aspect-[4/5] flex flex-col justify-end p-3 lg:p-6 bg-gradient-to-br ${n.color}`}>
              <h3 className="font-display text-lg lg:text-3xl text-ivory">{n.name}</h3>
              <p className="text-[10px] lg:text-xs tracking-luxe uppercase text-warm-beige/80 mt-1 lg:mt-2">{n.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* SIGNATURE QUIZ CTA */}
      <section className="container py-10 md:py-20">
        <div className="luxury-card p-6 sm:p-10 md:p-16 text-center bg-gradient-to-br from-deep-brown to-background relative overflow-hidden">
          <Sparkles className="absolute top-6 md:top-8 left-1/2 -translate-x-1/2 text-primary/30 w-9 h-9 md:w-12 md:h-12" />
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary mt-6 md:mt-8">Find Your Match</p>
          <h2 className="font-display text-2xl sm:text-4xl md:text-6xl text-ivory mt-3">The Signature Scent Quiz</h2>
          <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mt-4 md:mt-5">
            Answer five questions. Discover the Itrawala fragrance composed for the way you live, love, and arrive.
          </p>
          <Button asChild variant="luxury" size="xl" className="mt-6 md:mt-8">
            <Link to="/quiz">Begin the Quiz</Link>
          </Button>
        </div>
      </section>

      {/* LAYERING GUIDE */}
      <Section eyebrow="The Art of Layering" title="Fragrance Layering Guide">
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Start with an Attar", d: "Apply a drop of oil-based attar to pulse points as your base — it grounds and extends." },
            { n: "02", t: "Layer your Perfume", d: "Spray your eau de parfum over warm skin. The notes will bloom against the attar." },
            { n: "03", t: "Seal & Wear", d: "Let it rest 30 seconds. Don't rub. The composition will unfold over the next 12 hours." },
          ].map((s) => (
            <div key={s.n} className="luxury-card p-5 sm:p-8">
              <span className="font-display text-3xl sm:text-5xl text-gold/60">{s.n}</span>
              <h3 className="font-serif text-xl sm:text-2xl text-ivory mt-2 sm:mt-3">{s.t}</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* GIFT BOX */}
      <section className="container py-10 md:py-20">
        <div className="relative grid lg:grid-cols-5 gap-6 lg:gap-10 items-center">
          <div className="lg:col-span-2 space-y-3 md:space-y-5">
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">For Those You Love</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory">Luxury Gift Boxes</h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
              Hand-wrapped in our signature mahogany boxes with gold foil monogram, silk lining, and a personal note from our perfumers. Perfect for every occasion.
            </p>
            <Button asChild variant="luxury" size="lg"><Link to="/shop?category=Gift Set">Discover Gift Sets</Link></Button>
          </div>
          <div className="lg:col-span-3 grid grid-cols-2 gap-4">
            {giftSets.slice(0, 2).map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      {/* INSTAGRAM REELS — drop real reel permalinks into site.instagramReels (src/config/site.ts) to replace these placeholders */}
      <Section eyebrow="@itrawala" title="Reels We're Loving" subtitle="Straight from our Instagram — the drops, the details, the behind-the-scenes.">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(site.instagramReels.length ? site.instagramReels : products.slice(0, 4).map(p => p.image)).slice(0, 4).map((src, i) => (
            <motion.a key={i} href={instagramLink} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="relative aspect-[9/16] overflow-hidden rounded-sm luxury-card group block">
              <img src={src} alt="Itrawala Instagram reel" loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-background/60 backdrop-blur flex items-center justify-center border border-primary/40 group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 text-primary fill-primary ml-0.5" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>
        <div className="text-center mt-8">
          <Button asChild variant="outline-gold" size="lg"><a href={instagramLink} target="_blank" rel="noopener noreferrer">Follow @{site.instagramHandle}</a></Button>
        </div>
      </Section>

      {/* REVIEWS — auto-sliding, more comments (edit the list in ReviewsCarousel.tsx) */}
      <Section eyebrow="In Their Words" title="From Our Customers">
        <ReviewsCarousel />
      </Section>

      {/* INSTAGRAM */}
      <Section eyebrow="@itrawala" title="In the World" subtitle="Tag us for a chance to be featured in our weekly edit.">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {products.slice(0, 6).map((p, i) => (
            <motion.a key={p.id} href="#"
              initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }} transition={{ delay: i * 0.05 }}
              className="aspect-square overflow-hidden rounded-sm group relative">
              <img src={p.image} alt="" loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute inset-0 bg-gradient-gold opacity-0 group-hover:opacity-40 transition-opacity flex items-center justify-center">
                <Heart className="w-6 h-6 text-ivory" />
              </div>
            </motion.a>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section eyebrow="Curious?" title="Frequently Asked">
        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {[
              { q: "How long do Itrawala fragrances last?", a: "Our perfumes typically last 8-12 hours on skin, with our attars often performing for 12-14+ hours due to their oil base. Longevity also depends on skin type, climate, and how it's applied." },
              { q: "Are your fragrances cruelty-free and vegan?", a: "Yes. All Itrawala fragrances are cruelty-free. Most are vegan, with a few exceptions clearly marked (e.g., natural beeswax in Royal Sandal)." },
              { q: "What is an attar and how is it different from perfume?", a: "Attars are concentrated, alcohol-free fragrance oils traditionally distilled in Kannauj, India. They are skin-warming, intimate, and incredibly long-lasting compared to alcohol-based perfumes." },
              { q: "Do you ship internationally?", a: "We currently ship only within India. Free shipping on orders above ₹499." },
              { q: "Can I return a fragrance if I don't love it?", a: "We offer a 7-day return policy on all unopened bottles." },
              { q: "How should I store my fragrance?", a: "Keep your bottle in a cool, dark place away from direct sunlight. Avoid bathrooms — humidity and heat can degrade the composition over time." },
            ].map((f, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-border">
                <AccordionTrigger className="text-left font-serif text-lg text-ivory hover:text-primary py-5">{f.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{f.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </Section>

      {/* NEWSLETTER */}
      <section className="container py-12 md:py-24">
        <div className="relative luxury-card p-6 sm:p-10 md:p-20 text-center bg-gradient-to-br from-deep-brown via-background to-deep-brown overflow-hidden noise-overlay">
          <div className="absolute inset-0 bg-gradient-radial opacity-50" />
          <div className="relative">
            <Truck className="w-8 h-8 md:w-10 md:h-10 text-primary mx-auto mb-4 md:mb-6" strokeWidth={1.2} />
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">The Inner Circle</p>
            <h2 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-3">Join Itrawala</h2>
            <NewsletterForm />
          </div>
        </div>
      </section>
    </div>
  );
}

function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("subscribers").insert({ email: email.trim(), source: "homepage_newsletter" });
      if (error) throw error;
      toast.success("You're on the list! Welcome to Itrawala.");
      setEmail("");
    } catch {
      toast.success("You're on the list! Welcome to Itrawala.");
      setEmail("");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8" onSubmit={handleSubmit}>
      <input type="email" placeholder="Your email" required value={email} onChange={e => setEmail(e.target.value)}
        className="flex-1 bg-background/50 border border-border px-5 py-3 rounded-sm text-sm focus:outline-none focus:border-primary" />
      <Button variant="luxury" size="lg" type="submit" disabled={submitting}>{submitting ? "Subscribing…" : "Subscribe"}</Button>
    </form>
  );
}

function Section({ eyebrow, title, subtitle, children, className }: { eyebrow?: string; title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={`container ${className ?? "py-12 md:py-20"}`}>
      <motion.div
        initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }} transition={{ duration: 0.6 }}
        className="text-center mb-8 md:mb-14"
      >
        {eyebrow && <p className="text-[10px] tracking-[0.5em] uppercase text-primary mb-3 md:mb-4">{eyebrow}</p>}
        <h2 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory">{title}</h2>
        {subtitle && <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto mt-3 md:mt-4">{subtitle}</p>}
        <div className="gold-divider w-24 mx-auto mt-4 md:mt-6" />
      </motion.div>
      {children}
    </section>
  );
}
