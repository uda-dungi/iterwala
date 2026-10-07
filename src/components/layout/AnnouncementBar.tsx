import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { announcements as fallbackAnnouncements } from "@/config/site";

/** Auto-sliding trust statements pinned above the header. */
export function AnnouncementBar() {
  const [i, setI] = useState(0);
  // Always the compiled list (src/config/site.ts) — the old database rows were still
  // overriding the Karwa Chauth messages. Admin → Announcements no longer drives the bar.
  const announcements = fallbackAnnouncements;

  useEffect(() => {
    setI(0);
    const id = setInterval(() => setI(p => (p + 1) % announcements.length), 3500);
    return () => clearInterval(id);
  }, [announcements.length]);

  return (
    <div className="bg-gradient-gold text-primary-foreground h-9 flex items-center justify-center overflow-hidden relative">
      <AnimatePresence mode="wait">
        <motion.span
          key={i}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.4 }}
          // whitespace-nowrap keeps a message on one line — the widest one ("Janmashtami
          // Special Sale is Live Now") was wrapping its trailing star onto a second row.
          // Mobile also drops to the narrower default tracking so it fits at 360px.
          className="text-[11px] md:text-xs tracking-normal md:tracking-luxe uppercase font-medium px-3 md:px-4 text-center whitespace-nowrap"
        >
          {announcements[i]}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
