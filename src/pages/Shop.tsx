import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Filter, X } from "lucide-react";
import { products } from "@/data/products";
import { ProductCard } from "@/components/shop/ProductCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const genders = ["Men", "Women", "Unisex"];
const categories = ["Perfume", "Attar", "Gift Set", "Air Freshener", "Diffuser", "New Launch", "Collector's Edition"];
const noteList = ["Oud", "Rose", "Saffron", "Amber", "Sandalwood", "Musk", "Vanilla", "Jasmine"];
const occasions = ["Evening", "Daily Wear", "Date Night", "Office", "Formal", "Festive"];

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState(params.get("sort") || "popular");
  const [price, setPrice] = useState<[number]>([8000]);
  const [filterOpen, setFilterOpen] = useState(false);

  const selectedGender = params.get("gender");
  const selectedCategory = params.get("category");
  const selectedMood = params.get("mood");
  const search = params.get("search") || "";

  const toggleParam = (key: string, val: string) => {
    const next = new URLSearchParams(params);
    if (next.get(key) === val) next.delete(key); else next.set(key, val);
    setParams(next);
  };

  const setSearch = (val: string) => {
    const next = new URLSearchParams(params);
    if (val) next.set("search", val); else next.delete("search");
    setParams(next, { replace: true });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const matchesSearch = (p: typeof products[number]) =>
      !q || [
        p.name, p.tagline, p.category, p.gender, p.description,
        ...p.notes.top, ...p.notes.heart, ...p.notes.base,
        ...p.moods, ...p.occasions,
      ].some(s => s.toLowerCase().includes(q));

    let r = products.filter(p =>
      (!selectedGender || p.gender === selectedGender) &&
      (!selectedCategory || p.category === selectedCategory) &&
      (!selectedMood || p.moods.some(m => m.toLowerCase() === selectedMood.toLowerCase())) &&
      p.price <= price[0] &&
      matchesSearch(p)
    );
    if (sort === "price-low") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "price-high") r = [...r].sort((a, b) => b.price - a.price);
    if (sort === "new") r = r.filter(p => p.newArrival).concat(r.filter(p => !p.newArrival));
    if (sort === "best") r = r.filter(p => p.bestSeller).concat(r.filter(p => !p.bestSeller));
    return r;
  }, [selectedGender, selectedCategory, selectedMood, price, search, sort]);

  const Filters = () => (
    <aside className="space-y-8">
      <div>
        <h3 className="text-xs tracking-luxe uppercase text-primary mb-3">Search</h3>
        <Input placeholder="Find a scent..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <FilterGroup title="Gender">
        {genders.map(g => (
          <FilterCheck key={g} label={g} checked={selectedGender === g} onClick={() => toggleParam("gender", g)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Category">
        {categories.map(c => (
          <FilterCheck key={c} label={c} checked={selectedCategory === c} onClick={() => toggleParam("category", c)} />
        ))}
      </FilterGroup>
      <FilterGroup title="Price">
        <Slider value={price} onValueChange={(v) => setPrice(v as [number])} max={8000} step={500} className="mt-4" />
        <p className="text-xs text-muted-foreground mt-2">Up to ₹{price[0].toLocaleString("en-IN")}</p>
      </FilterGroup>
      <FilterGroup title="Fragrance Notes">
        <div className="flex flex-wrap gap-2">
          {noteList.map(n => (
            <button key={n} className="text-xs px-3 py-1 border border-border rounded-sm hover:border-primary hover:text-primary transition-colors">{n}</button>
          ))}
        </div>
      </FilterGroup>
      <FilterGroup title="Occasion">
        <div className="flex flex-wrap gap-2">
          {occasions.map(o => (
            <button key={o} className="text-xs px-3 py-1 border border-border rounded-sm hover:border-primary hover:text-primary transition-colors">{o}</button>
          ))}
        </div>
      </FilterGroup>
    </aside>
  );

  return (
    <div>
      {/* Page header */}
      <section className="container pt-8 pb-6 sm:pt-12 sm:pb-10 text-center">
        <p className="text-[10px] tracking-[0.5em] uppercase text-primary">The Collection</p>
        <h1 className="font-display text-3xl sm:text-4xl md:text-7xl text-ivory mt-3">Shop Fragrances</h1>
        <p className="text-sm sm:text-base text-muted-foreground max-w-xl mx-auto mt-3 sm:mt-4">
          Explore our complete library of perfumes, attars, and gift sets — composed for every mood and moment.
        </p>
        <div className="gold-divider w-24 mx-auto mt-4 sm:mt-6" />
      </section>

      <div className="container pb-14 sm:pb-24 grid lg:grid-cols-[260px_1fr] gap-6 lg:gap-10">
        <div className="hidden lg:block sticky top-32 self-start">
          <Filters />
        </div>

        <div>
          <div className="flex items-center justify-between mb-5 sm:mb-8 gap-3 flex-wrap">
            <p className="text-xs sm:text-sm text-muted-foreground">{filtered.length} fragrances</p>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button variant="outline-gold" size="sm" className="lg:hidden" onClick={() => setFilterOpen(true)}>
                <Filter className="w-4 h-4 mr-1" /> Filter
              </Button>
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-36 sm:w-44 border-border text-xs sm:text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Popularity</SelectItem>
                  <SelectItem value="new">New Arrivals</SelectItem>
                  <SelectItem value="best">Best Sellers</SelectItem>
                  <SelectItem value="price-low">Price: Low to High</SelectItem>
                  <SelectItem value="price-high">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-14 sm:py-24">
              <p className="font-serif text-xl sm:text-2xl text-ivory">No fragrances found</p>
              <p className="text-sm sm:text-base text-muted-foreground mt-2">Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
              {filtered.map((p, i) => <ProductCard key={p.id} product={p} index={i} />)}
            </div>
          )}
        </div>
      </div>

      {filterOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-background/80" onClick={() => setFilterOpen(false)} />
          <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} className="absolute right-0 top-0 h-full w-[85vw] max-w-sm bg-card p-5 sm:p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-display text-2xl text-gold">Filters</h3>
              <button onClick={() => setFilterOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <Filters />
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs tracking-luxe uppercase text-primary mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function FilterCheck({ label, checked, onClick }: { label: string; checked: boolean; onClick: () => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm hover:text-primary transition-colors">
      <Checkbox checked={checked} onCheckedChange={onClick} />
      {label}
    </label>
  );
}
