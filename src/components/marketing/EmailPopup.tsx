import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

const SEEN_KEY = "itr_email_popup_seen";

/** Exit-intent / scroll-triggered email capture. Shows once per browser. */
export function EmailPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (localStorage.getItem(SEEN_KEY)) return;

    const trigger = () => {
      if (localStorage.getItem(SEEN_KEY)) return;
      setOpen(true);
      localStorage.setItem(SEEN_KEY, "1");
      cleanup();
    };
    const onMouseOut = (e: MouseEvent) => { if (e.clientY <= 0) trigger(); };
    const onScroll = () => { if (window.scrollY > 1600) trigger(); };
    const timer = setTimeout(trigger, 25000);

    document.addEventListener("mouseout", onMouseOut);
    window.addEventListener("scroll", onScroll, { passive: true });
    function cleanup() {
      clearTimeout(timer);
      document.removeEventListener("mouseout", onMouseOut);
      window.removeEventListener("scroll", onScroll);
    }
    return cleanup;
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (supabase) {
      await supabase.from("subscribers").insert({ email, source: "exit_popup" }).then(() => {});
    }
    toast.success("Welcome to the Inner Circle — your 10% code is WELCOME10.");
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[95] flex items-center justify-center p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0 }}
            className="relative luxury-card max-w-md w-full p-10 text-center overflow-hidden"
          >
            <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-muted-foreground hover:text-primary" aria-label="Close">
              <X className="w-5 h-5" />
            </button>
            <Gift className="w-10 h-10 text-primary mx-auto mb-4" strokeWidth={1.2} />
            <p className="text-[10px] tracking-[0.5em] uppercase text-primary">Wait — before you go</p>
            <h2 className="font-display text-4xl text-ivory mt-3">Get 10% Off</h2>
            <p className="text-muted-foreground text-sm mt-3">
              Join the Inner Circle for early access & a welcome discount on your first order.
            </p>
            <form onSubmit={submit} className="mt-6 space-y-3">
              <input
                type="email" required value={email} onChange={e => setEmail(e.target.value)}
                placeholder="Your email"
                className="w-full bg-background/50 border border-border px-5 py-3 rounded-sm text-sm focus:outline-none focus:border-primary text-center"
              />
              <Button type="submit" variant="luxury" size="lg" className="w-full">Claim My 10% Off</Button>
            </form>
            <button onClick={() => setOpen(false)} className="text-xs text-muted-foreground mt-4 hover:text-ivory">
              No thanks, I'll pay full price
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
