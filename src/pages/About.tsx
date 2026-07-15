import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import collection from "@/assets/collection-attars.jpg";
import hero from "@/assets/hero-perfume.jpg";

export default function About() {
  return (
    <div>
      {/* Hero */}
      <section className="relative h-[70vh] flex items-center justify-center text-center overflow-hidden">
        <img src={hero} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/80" />
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1 }}
          className="relative container max-w-3xl">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Our Heritage</p>
          <h1 className="font-display text-5xl md:text-8xl text-ivory mt-4 leading-[0.95]">
            A Tradition <span className="italic text-gold">Bottled</span>
          </h1>
          <p className="text-lg text-muted-foreground mt-6 font-serif italic">
            Bringing timeless fragrance traditions into modern lifestyles.
          </p>
        </motion.div>
      </section>

      {/* Legacy stats */}
      <section className="container py-16 text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">About Itrawala</p>
        <h2 className="font-display text-4xl md:text-6xl text-ivory mt-3">Legacy of 25 Years</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-6 leading-relaxed">
          Itra Wala invites you to explore a world where scent is a language of the soul, where attars and
          perfumes become a part of your identity. Indulge in the allure of fragrances that transcend time and
          space, igniting emotions and memories that linger long after the scent fades. Experience the journey
          of fragrance today.
        </p>
        <div className="flex items-center justify-center gap-12 mt-8">
          <div>
            <p className="font-display text-4xl text-gold">400 K</p>
            <p className="text-xs tracking-luxe uppercase text-muted-foreground mt-1">Perfumes Sold</p>
          </div>
          <div>
            <p className="font-display text-4xl text-gold">10 Years</p>
            <p className="text-xs tracking-luxe uppercase text-muted-foreground mt-1">Perfect Years</p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="container py-20 grid lg:grid-cols-2 gap-16 items-center">
        <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
          transition={{ duration: 0.8 }} className="space-y-6">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Kannauj · India</p>
          <h2 className="font-display text-5xl text-ivory">The Itr Capital of the World</h2>
          <p className="text-muted-foreground leading-relaxed">
            For over 500 years, the perfumers of Kannauj have practiced the art of <em className="text-ivory">deg-bhapka</em> — a slow, copper-vessel distillation that captures the soul of rose petals, oud, jasmine, and sandalwood in their purest form.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Itrawala was born from a single belief: this art deserves a modern stage. We work directly with master perfumer families in Kannauj, sourcing the finest raw materials and translating their craft into bottles that belong on the vanities of today.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Every Itrawala fragrance is a quiet collaboration — between Kannauj and Paris, between heritage and now.
          </p>
        </motion.div>
        <motion.img
          initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
          transition={{ duration: 1 }}
          src={collection} alt="Attar collection" className="rounded-sm border border-border shadow-luxury" />
      </section>

      {/* Values */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">What We Stand For</p>
          <h2 className="font-display text-5xl text-ivory mt-2">Our Tenets</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Honour the Source", d: "We pay perfumer families fairly, transparently, and on time — for as long as we exist." },
            { n: "02", t: "Never Compromise", d: "If the rose isn't ready, we wait. If the oud isn't aged, we age it. Time is an ingredient." },
            { n: "03", t: "Wearable Luxury", d: "Heritage that fits the rhythm of a modern day — boardroom, brunch, midnight, monsoon." },
          ].map(v => (
            <div key={v.n} className="luxury-card p-10">
              <span className="font-display text-6xl text-gold/60">{v.n}</span>
              <h3 className="font-serif text-2xl text-ivory mt-4">{v.t}</h3>
              <p className="text-muted-foreground mt-3 leading-relaxed">{v.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Timeline */}
      <section className="container py-20">
        <div className="text-center mb-12">
          <p className="text-[10px] tracking-[0.5em] uppercase text-primary">The Journey</p>
          <h2 className="font-display text-5xl text-ivory mt-2">From Petal to Bottle</h2>
        </div>
        <div className="space-y-4 max-w-3xl mx-auto">
          {[
            { t: "Hand Harvest", d: "Rose petals picked at dawn in Rajasthan and Kannauj — when the oils peak." },
            { t: "Deg-Bhapka Distillation", d: "Slow distilled in copper vessels over wood fire. No shortcuts. No steam." },
            { t: "Aging", d: "Compositions rest in oak and sandalwood barrels — from 6 months to 12 years." },
            { t: "French Blending", d: "Finished in Grasse, France, with our master perfumer's modern accords." },
            { t: "Hand Packaged", d: "Wrapped in our Mumbai atelier, sealed with gold foil, signed by hand." },
          ].map((s, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex gap-6 items-start luxury-card p-6">
              <span className="font-display text-3xl text-gold w-12 shrink-0">0{i + 1}</span>
              <div>
                <h3 className="font-serif text-xl text-ivory">{s.t}</h3>
                <p className="text-muted-foreground mt-1">{s.d}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="container py-24 text-center">
        <h2 className="font-display text-5xl text-ivory">Begin your Itrawala journey.</h2>
        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">Explore the full collection — or take the signature scent quiz.</p>
        <div className="flex flex-wrap justify-center gap-4 mt-8">
          <Button asChild variant="luxury" size="xl"><Link to="/shop">Explore Collection</Link></Button>
          <Button asChild variant="outline-gold" size="xl"><Link to="/quiz">Take the Scent Quiz</Link></Button>
          <Button asChild variant="ghostGold" size="xl"><Link to="/contact">Get in Touch</Link></Button>
        </div>
      </section>
    </div>
  );
}
