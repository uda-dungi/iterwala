import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Heart, LogOut, Menu, MessageCircle, Search, ShoppingBag, User, X } from "lucide-react";
import { useShop } from "@/store/shop";
import { useAuth, displayName } from "@/store/auth";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { whatsappLink } from "@/config/site";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import logo from "@/assets/brand/logo.png";

const links = [
  { to: "/", label: "Home" },
  { to: "/shop", label: "Shop" },
  { to: "/shop?sort=new", label: "New Launches" },
  { to: "/wholesale", label: "Wholesale" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

const categoryMenu = [
  { to: "/shop?category=Perfume", label: "Perfumes" },
  { to: "/shop?category=Attar", label: "Attars" },
  { to: "/shop?category=Air Freshener", label: "Air Fresheners" },
  { to: "/shop?category=Diffuser", label: "Diffusers" },
  { to: "/shop?category=Gift Set", label: "Gift Sets" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { itemCount, setCartOpen, wishlist } = useShop();
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const nav = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out");
    nav("/");
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { setOpen(false); setSearchOpen(false); }, [loc.pathname]);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    setSearchOpen(false);
    nav(q ? `/shop?search=${encodeURIComponent(q)}` : "/shop");
  };

  return (
    <>
      {/* Top announcement */}
      <AnnouncementBar />

      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className={cn(
          "sticky top-0 z-50 transition-all duration-500",
          scrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-border/60 shadow-card"
            : "bg-background/40 backdrop-blur-md"
        )}
      >
        <div className="container flex items-center justify-between h-28 gap-4">
          <div className="flex items-center gap-2 shrink-0">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 -ml-2 text-ivory" aria-label="Menu">
              <Menu className="w-5 h-5" />
            </button>

            <Link to="/" className="flex items-center group">
              <img src={logo} alt="Itrawala" className="h-20 md:h-24 w-auto object-contain transition-transform group-hover:scale-105" />
            </Link>
          </div>

          <nav className="hidden lg:flex items-center gap-6 flex-1 justify-center">
            {links.slice(0, 2).map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) =>
                cn("text-xs tracking-luxe uppercase font-semibold transition-colors relative group whitespace-nowrap",
                  isActive ? "text-primary" : "text-ivory/80 hover:text-primary")}>
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-500" />
              </NavLink>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger className="text-xs tracking-luxe uppercase font-semibold text-ivory/80 hover:text-primary transition-colors flex items-center gap-1 focus:outline-none whitespace-nowrap">
                Category <ChevronDown className="w-3 h-3" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="w-44">
                {categoryMenu.map(c => (
                  <DropdownMenuItem key={c.to} asChild>
                    <Link to={c.to} className="cursor-pointer">{c.label}</Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {links.slice(2).map(l => (
              <NavLink key={l.to} to={l.to} className={({ isActive }) =>
                cn("text-xs tracking-luxe uppercase font-semibold transition-colors relative group whitespace-nowrap",
                  isActive ? "text-primary" : "text-ivory/80 hover:text-primary")}>
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary group-hover:w-full transition-all duration-500" />
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-1 md:gap-3 shrink-0">
            <a href={whatsappLink()} target="_blank" rel="noopener noreferrer" className="p-2 text-ivory/80 hover:text-[#25D366] transition-colors hidden sm:block" aria-label="WhatsApp">
              <MessageCircle className="w-4 h-4" />
            </a>
            <button onClick={() => setSearchOpen(true)} className="p-2 text-ivory/80 hover:text-primary transition-colors" aria-label="Search">
              <Search className="w-4 h-4" />
            </button>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger className="p-2 text-ivory/80 hover:text-primary transition-colors hidden md:flex items-center gap-1.5 focus:outline-none" aria-label="Account">
                  <User className="w-4 h-4" />
                  <span className="text-xs tracking-luxe uppercase max-w-[100px] truncate">{displayName(user)}</span>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52">
                  <DropdownMenuLabel className="font-normal">
                    <p className="text-xs text-muted-foreground">Signed in as</p>
                    <p className="text-sm text-ivory truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/orders" className="cursor-pointer">My Orders</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wishlist" className="cursor-pointer">My Wishlist</Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/auth" className="p-2 text-ivory/80 hover:text-primary transition-colors hidden md:block" aria-label="Account">
                <User className="w-4 h-4" />
              </Link>
            )}
            <Link to="/wishlist" className="p-2 text-ivory/80 hover:text-primary transition-colors relative" aria-label="Wishlist">
              <Heart className="w-4 h-4" />
              {wishlist.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {wishlist.length}
                </span>
              )}
            </Link>
            <button onClick={() => setCartOpen(true)} className="p-2 text-ivory hover:text-primary transition-colors relative" aria-label="Cart">
              <ShoppingBag className="w-4 h-4" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-bold">
                  {itemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div className="fixed inset-0 z-[60] lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-background/95 backdrop-blur-xl" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.4 }}
              className="relative w-80 max-w-[85%] h-full bg-card border-r border-border p-8 flex flex-col">
              <button onClick={() => setOpen(false)} className="self-end text-ivory/70"><X className="w-5 h-5" /></button>
              <img src={logo} alt="Itrawala" className="h-14 w-auto object-contain mt-4" />
              <div className="gold-divider my-6" />
              <nav className="flex flex-col gap-5">
                {links.slice(0, 2).map(l => (
                  <Link key={l.to} to={l.to} className="text-sm tracking-luxe uppercase text-ivory/80 hover:text-primary">
                    {l.label}
                  </Link>
                ))}
                <div className="pt-1">
                  <p className="text-sm tracking-luxe uppercase text-primary mb-3">Category</p>
                  <div className="flex flex-col gap-3 pl-3 border-l border-border">
                    {categoryMenu.map(c => (
                      <Link key={c.to} to={c.to} className="text-sm tracking-luxe uppercase text-ivory/80 hover:text-primary">
                        {c.label}
                      </Link>
                    ))}
                  </div>
                </div>
                {links.slice(2).map(l => (
                  <Link key={l.to} to={l.to} className="text-sm tracking-luxe uppercase text-ivory/80 hover:text-primary">
                    {l.label}
                  </Link>
                ))}
              </nav>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div className="fixed inset-0 z-[80]"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-background/90 backdrop-blur-xl" onClick={() => setSearchOpen(false)} />
            <motion.div
              initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
              transition={{ duration: 0.35 }}
              className="relative container pt-28">
              <div className="flex justify-end mb-6">
                <button onClick={() => setSearchOpen(false)} className="text-ivory/70 hover:text-primary" aria-label="Close search">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <form onSubmit={submitSearch} className="max-w-2xl mx-auto">
                <p className="text-[10px] tracking-[0.5em] uppercase text-primary text-center mb-4">Search the Maison</p>
                <div className="flex items-center gap-3 border-b-2 border-primary/60 pb-3">
                  <Search className="w-6 h-6 text-primary shrink-0" />
                  <input
                    autoFocus
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                    placeholder="Search by name, note, mood, or occasion…"
                    className="flex-1 bg-transparent text-2xl md:text-3xl font-serif text-ivory placeholder:text-muted-foreground/60 focus:outline-none"
                  />
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">Press Enter to search · Try "oud", "rose", or "evening"</p>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
