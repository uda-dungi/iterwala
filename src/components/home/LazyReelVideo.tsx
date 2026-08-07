import { useEffect, useRef, useState } from "react";

/**
 * A reel tile that downloads its video only once it actually scrolls near the viewport.
 *
 * The homepage shows 8 reels. Rendering them as plain <video autoPlay> made the browser
 * fetch every one on page load — ~81MB of MP4 before the shopper had scrolled anywhere
 * near them, which was the single biggest cause of the site feeling slow. Here the `src`
 * stays unset (and preload="none") until an IntersectionObserver says the tile is close
 * to view, so initial page load costs zero video bytes.
 *
 * Playback also pauses when the tile scrolls away, so off-screen reels don't keep
 * decoding frames and draining battery/CPU on mobile.
 */
export function LazyReelVideo({ src, className }: { src: string; className?: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  // Once we've decided to load, keep the src attached — otherwise scrolling back and
  // forth would re-download the same file every time.
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          // play() rejects when autoplay is disallowed (some mobile power-saving modes);
          // that's expected, and the tile is click-to-open anyway.
          el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      // Start fetching slightly before the tile is on screen so it isn't blank on arrival.
      { rootMargin: "300px" }
    );

    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <video
      ref={ref}
      src={shouldLoad ? src : undefined}
      muted
      loop
      playsInline
      preload="none"
      className={className}
    />
  );
}
