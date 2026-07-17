import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, RotateCcw, ArrowLeft, Star, ShoppingBag } from "lucide-react";
import { products, Product, imageFor, listingVolume, priceFor } from "@/data/products";
import { useShop, formatINR } from "@/store/shop";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Option = { label: string; desc?: string; value: string };
type Question = { key: string; eyebrow: string; title: string; options: Option[] };

const questions: Question[] = [
  {
    key: "gender", eyebrow: "Question 01", title: "Who is this fragrance for?",
    options: [
      { label: "For Her", desc: "Feminine compositions", value: "Women" },
      { label: "For Him", desc: "Masculine compositions", value: "Men" },
      { label: "Unisex", desc: "Beautiful on anyone", value: "Unisex" },
      { label: "Surprise Me", desc: "No preference", value: "any" },
    ],
  },
  {
    key: "mood", eyebrow: "Question 02", title: "Which best describes your spirit?",
    options: [
      { label: "Confident & Mysterious", value: "Confident,Mysterious" },
      { label: "Romantic & Soft", value: "Romantic,Soft" },
      { label: "Bold & Magnetic", value: "Bold,Magnetic" },
      { label: "Calm & Grounded", value: "Calm,Grounded" },
    ],
  },
  {
    key: "occasion", eyebrow: "Question 03", title: "When will you wear it most?",
    options: [
      { label: "Evenings & Date Nights", value: "Evening,Date Night" },
      { label: "Daily & The Office", value: "Daily Wear,Office" },
      { label: "Festive & Celebrations", value: "Festive,Celebrations,Weddings" },
      { label: "Formal & Special Occasions", value: "Formal,Special Occasions" },
    ],
  },
  {
    key: "family", eyebrow: "Question 04", title: "Which scent family calls to you?",
    options: [
      { label: "Woody & Oud", desc: "Oud, sandalwood, vetiver", value: "oud,sandalwood,agarwood,vetiver,patchouli,wood,cedar,leather" },
      { label: "Floral & Rose", desc: "Rose, jasmine, iris", value: "rose,jasmine,tuberose,iris,geranium,orris,floral" },
      { label: "Spicy & Warm", desc: "Saffron, cardamom, pepper", value: "saffron,cardamom,pepper,cinnamon,spice" },
      { label: "Fresh & Green", desc: "Citrus, tea, dewy notes", value: "bergamot,mint,tea,bamboo,earth,mandarin,lychee,pear,citrus,green" },
    ],
  },
  {
    key: "projection", eyebrow: "Question 05", title: "How loud should your scent be?",
    options: [
      { label: "Intimate", desc: "A whisper, close to skin", value: "Intimate,Soft" },
      { label: "Balanced", desc: "Noticed, never overwhelming", value: "Moderate" },
      { label: "Bold", desc: "Enters the room before you", value: "Strong" },
    ],
  },
];

function scoreProduct(p: Product, answers: Record<string, string>) {
  let score = 0;
  if (answers.gender && answers.gender !== "any") {
    if (p.gender === answers.gender) score += 3;
    else if (p.gender === "Unisex") score += 1;
  } else if (answers.gender === "any" && p.gender === "Unisex") score += 1;

  if (answers.mood) {
    const moods = answers.mood.toLowerCase().split(",");
    if (p.moods.some(m => moods.includes(m.toLowerCase()))) score += 3;
  }
  if (answers.occasion) {
    const occ = answers.occasion.toLowerCase().split(",");
    if (p.occasions.some(o => occ.includes(o.toLowerCase()))) score += 3;
  }
  if (answers.family) {
    const keys = answers.family.toLowerCase().split(",");
    const notes = [...p.notes.top, ...p.notes.heart, ...p.notes.base].join(" ").toLowerCase();
    score += Math.min(keys.filter(k => notes.includes(k)).length, 3) * 2;
  }
  if (answers.projection) {
    const proj = answers.projection.toLowerCase().split(",");
    if (proj.includes(p.projection.toLowerCase())) score += 2;
  }
  return score;
}

export default function Quiz() {
  const { addToCart } = useShop();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);

  const result = useMemo(() => {
    if (!done) return null;
    const ranked = [...products]
      .map(p => ({ p, s: scoreProduct(p, answers) }))
      .sort((a, b) => b.s - a.s || b.p.rating - a.p.rating);
    return { match: ranked[0].p, alts: ranked.slice(1, 4).map(r => r.p) };
  }, [done, answers]);

  const choose = (value: string) => {
    const q = questions[step];
    setAnswers({ ...answers, [q.key]: value });
    if (step < questions.length - 1) setStep(step + 1);
    else setDone(true);
  };

  const restart = () => { setStep(0); setAnswers({}); setDone(false); };
  const progress = done ? 100 : (step / questions.length) * 100;
  const resultVolume = result ? listingVolume(result.match) : undefined;
  const resultCardImage = result ? imageFor(result.match, resultVolume) : undefined;
  const resultCardPrice = result ? priceFor(result.match, resultVolume).price : 0;

  return (
    <div className="container py-8 md:py-16 min-h-[70vh]">
      <div className="text-center mb-6 md:mb-10">
        <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary mx-auto mb-3 sm:mb-4" strokeWidth={1.2} />
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Find Your Signature Scent</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-6xl text-ivory mt-3">The Fragrance Finder</h1>
        <div className="gold-divider w-24 mx-auto mt-4 sm:mt-6" />
      </div>

      <div className="max-w-2xl mx-auto mb-10">
        <div className="h-px bg-border relative">
          <motion.div className="absolute left-0 top-0 h-px bg-gradient-gold"
            animate={{ width: `${progress}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>

      <AnimatePresence mode="wait">
        {!done ? (
          <motion.div key={step}
            initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.4 }} className="max-w-3xl mx-auto">
            <p className="text-center text-[10px] tracking-[0.5em] uppercase text-primary">{questions[step].eyebrow}</p>
            <h2 className="text-center font-display text-3xl md:text-4xl text-ivory mt-3 mb-10">{questions[step].title}</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {questions[step].options.map(opt => (
                <button key={opt.value} onClick={() => choose(opt.value)}
                  className="luxury-card p-6 text-left hover:border-primary group">
                  <p className="font-serif text-xl text-ivory group-hover:text-primary transition-colors">{opt.label}</p>
                  {opt.desc && <p className="text-sm text-muted-foreground mt-1">{opt.desc}</p>}
                </button>
              ))}
            </div>
            <div className="flex justify-center mt-10">
              {step > 0 && (
                <Button variant="ghostGold" onClick={() => setStep(step - 1)}>
                  <ArrowLeft className="w-4 h-4 mr-1" /> Back
                </Button>
              )}
            </div>
          </motion.div>
        ) : result && (
          <motion.div key="result"
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="max-w-5xl mx-auto">
              <div className="text-center mb-10">
                <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Your Signature Scent</p>
                <h2 className="font-display text-4xl md:text-5xl text-gold mt-3">We found your match</h2>
              </div>
              <div className="luxury-card grid md:grid-cols-2 gap-0 overflow-hidden">
                <div className="relative aspect-square md:aspect-auto bg-deep-brown">
                  <img src={resultCardImage} alt={result.match.name} className="w-full h-full object-cover" />
                  {result.match.badge && (
                    <span className="absolute top-4 left-4 text-[10px] tracking-luxe uppercase px-3 py-1 bg-gradient-gold text-primary-foreground font-semibold">
                      {result.match.badge}
                    </span>
                  )}
                </div>
              <div className="p-8 md:p-10 flex flex-col justify-center">
                <p className="text-[10px] tracking-luxe uppercase text-primary">{result.match.category} · {result.match.gender}</p>
                <h3 className="font-display text-4xl text-ivory mt-2">{result.match.name}</h3>
                <p className="font-serif italic text-muted-foreground mt-1">{result.match.tagline}</p>
                <div className="flex items-center gap-1 mt-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={cn("w-4 h-4", i < Math.round(result.match.rating) ? "fill-primary text-primary" : "text-muted")} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-1">({result.match.reviews})</span>
                </div>
                <p className="text-muted-foreground text-sm leading-relaxed mt-4">{result.match.description}</p>
                <p className="font-display text-3xl text-gold mt-5">{formatINR(resultCardPrice)}</p>
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <Button variant="luxury" size="lg" className="flex-1"
                    onClick={() => { addToCart(result.match, 1, resultVolume); toast.success(`${result.match.name} added to cart`); }}>
                    <ShoppingBag className="w-4 h-4 mr-1" /> Add to Cart
                  </Button>
                  <Button asChild variant="outline-gold" size="lg" className="flex-1">
                    <Link to={`/product/${result.match.slug}`}>View Details</Link>
                  </Button>
                </div>
              </div>
            </div>
            <div className="mt-14">
              <p className="text-center text-[10px] tracking-[0.5em] uppercase text-primary">You May Also Love</p>
              <h3 className="text-center font-display text-3xl text-ivory mt-2 mb-8">Other Great Matches</h3>
              <div className="grid sm:grid-cols-3 gap-6">
                {result.alts.map(p => {
                  const defaultVolume = listingVolume(p);
                  const cardImage = imageFor(p, defaultVolume);
                  const { price: cardPrice } = priceFor(p, defaultVolume);
                  return (
                    <Link key={p.id} to={`/product/${p.slug}`} className="luxury-card group">
                      <div className="aspect-[4/5] overflow-hidden bg-deep-brown">
                        <img src={cardImage} alt={p.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                      </div>
                      <div className="p-4 text-center">
                        <h4 className="font-serif text-lg text-ivory group-hover:text-primary transition-colors">{p.name}</h4>
                        <p className="text-sm text-gold mt-1">{formatINR(cardPrice)}</p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            <div className="flex justify-center mt-12">
              <Button variant="ghostGold" size="lg" onClick={restart}>
                <RotateCcw className="w-4 h-4 mr-1" /> Retake the Quiz
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
