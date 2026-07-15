import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { announcements } from "@/config/site";

/** Auto-sliding trust statements pinned above the header. */
export function AnnouncementBar() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI(p => (p + 1) % announcements.length), 3500);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="bg-gradient-gold text-primary-foreground h-9 flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="text-[11px] md:text-xs tracking-luxe uppercase font-medium px-4 text-center"
        >
          {announcements[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
