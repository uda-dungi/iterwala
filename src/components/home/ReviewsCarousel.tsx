import { useEffect, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Carousel, CarouselContent, CarouselItem, type CarouselApi } from "@/components/ui/carousel";

const AUTOPLAY_MS = 4000;

// EDIT: add/remove reviews here — the carousel re-flows and keeps auto-sliding
// no matter how many are listed.
const reviews = [
  { n: "Aisha M.", c: "Mumbai", t: "Oud Royale is hands-down the most compliment-worthy scent I've ever worn. It feels old-world and modern at once." },
  { n: "Rohan K.", c: "Bangalore", t: "The Imperial Oud Attar is a revelation. One drop lasts the entire day. Worth every rupee." },
  { n: "Priya S.", c: "Delhi", t: "Velvet Musk has become my signature. Strangers stop me on the street. The packaging is unreal." },
  { n: "Aditya R.", c: "Delhi", t: "The moment I opened the bottle, I was transported to old Mughal courts. Royal Oud feels like heritage captured in a vial — it lingers for hours." },
  { n: "Natasha M.", c: "Jaipur", t: "Light, flirty, effortless — just how a Sunday brunch scent should be. White Musk is my go-to for daily wear and it feels luxurious every time." },
  { n: "Siddharth P.", c: "Hyderabad", t: "Rooh Chandan surprised me — soft, warm, and long-lasting without being loud. Gives me that 'imported perfume' feel for a fraction of the price." },
  { n: "Rhea K.", c: "Chandigarh", t: "Itrawala isn't just about perfumes, it's about stories bottled beautifully. From the packaging to the lasting fragrance, it screams class." },
  { n: "Arjun K.", c: "Bangalore", t: "One word: irresistible. Jannat Firdaus's deep, warm base notes layer beautifully for any occasion. People always ask what I'm wearing." },
  { n: "Meera J.", c: "Pune", t: "Shahi Gulab is pure rose, no synthetic sharpness. My grandmother used to wear something like this — it brought back so many memories." },
];

export function ReviewsCarousel() {
  const [api, setApi] = useState<CarouselApi>();
  const [paused, setPaused] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!api) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || paused) return;
    timerRef.current = setInterval(() => api.scrollNext(), AUTOPLAY_MS);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [api, paused]);

  return (
    <div onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <Carousel setApi={setApi} opts={{ loop: true, align: "start" }} aria-label="Patron reviews, sliding automatically">
        <CarouselContent>
          {reviews.map((r, i) => (
            <CarouselItem key={r.n} className="basis-full sm:basis-1/2 lg:basis-1/3">
              <motion.div
                initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }} transition={{ delay: (i % 3) * 0.15 }}
                className="luxury-card p-8 h-full flex flex-col"
              >
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: 5 }).map((_, s) => <Sparkles key={s} className="w-4 h-4 text-primary fill-primary" />)}
                </div>
                <p className="font-serif text-lg italic text-ivory leading-relaxed flex-1">"{r.t}"</p>
                <div className="mt-6 pt-4 border-t border-border">
                  <p className="text-sm text-primary">{r.n}</p>
                  <p className="text-xs text-muted-foreground">{r.c}</p>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}
