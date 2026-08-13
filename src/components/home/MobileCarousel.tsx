import { Children, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Mobile-only horizontal strip with dot pagination instead of the browser's scrollbar.
 *
 * The native scrollbar these sections used to show rendered as a stray gold bar under
 * the cards that read as a broken UI element rather than a control. Dots communicate
 * "there is more, here's where you are" without that ambiguity.
 *
 * Scroll position drives the active dot (rather than tracking it on tap) so a swipe and
 * a dot tap stay in agreement.
 */
export function MobileCarousel({
  children,
  itemClassName = "min-w-[46%]",
  className,
}: {
  children: React.ReactNode;
  itemClassName?: string;
  className?: string;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const items = Children.toArray(children);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => {
      const kids = Array.from(el.children) as HTMLElement[];
      if (!kids.length) return;
      // Nearest child to the scroller's left edge — matches what snap-start lands on.
      let nearest = 0;
      let best = Infinity;
      kids.forEach((kid, i) => {
        const dist = Math.abs(kid.offsetLeft - el.scrollLeft - el.offsetLeft);
        if (dist < best) { best = dist; nearest = i; }
      });
      setActive(nearest);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, [items.length]);

  const goTo = (i: number) => {
    const el = scrollerRef.current;
    const kid = el?.children[i] as HTMLElement | undefined;
    if (!el || !kid) return;
    el.scrollTo({ left: kid.offsetLeft - el.offsetLeft, behavior: "smooth" });
  };

  return (
    <div className={className}>
      <div
        ref={scrollerRef}
        // scrollbar-none hides the native bar this component replaces with dots.
        className="-mx-4 px-4 flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-none"
      >
        {items.map((child, i) => (
          <div key={i} className={cn("snap-start", itemClassName)}>
            {child}
          </div>
        ))}
      </div>
      {items.length > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              aria-label={`Go to item ${i + 1}`}
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                i === active ? "w-5 bg-primary" : "w-1.5 bg-muted-foreground/40",
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
