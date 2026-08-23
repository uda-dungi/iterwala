import { useEffect, useRef } from "react";

/**
 * A product-gallery video slide.
 *
 * Starts itself, muted, once the slide is genuinely on screen, and pauses again when it
 * scrolls away. That "on screen" test is an IntersectionObserver rather than a prop
 * carrying the active index because the mobile carousel keeps every slide mounted at
 * once — an offscreen slide told to play would not only play unseen, it would pull its
 * whole file down to do it.
 *
 * Muted is not an aesthetic choice. Browsers refuse to autoplay a clip with sound, so an
 * unmuted autoplay is simply blocked and the shopper gets a frozen poster instead of a
 * video. Native `controls` stay on, which puts sound one tap away for anyone who wants it
 * — and gives play/scrub/fullscreen/captions for free, correctly, in the iOS fullscreen
 * player that a custom overlay cannot.
 *
 * `preload="none"` still holds right up until that first play, so a shopper who never
 * reaches this slide never pays for it. These clips are 7–20MB each — an order of
 * magnitude heavier than every photo on the page put together — so until then the
 * browser paints `poster`, which callers pass as the product's own first photo, and the
 * slide reads as part of the gallery rather than a black rectangle.
 */
export function GalleryVideo({
  src,
  poster,
  title,
  className,
  onEnded,
}: {
  src: string;
  poster?: string;
  title?: string;
  className?: string;
  /** Fired when the clip finishes, so the gallery can resume its own rotation. */
  onEnded?: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Someone who has asked for less motion has not asked for a video to start itself.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;

    // React has historically been unreliable about the `muted` attribute specifically,
    // and muted is load-bearing here — without it autoplay is refused outright.
    el.muted = true;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          // play() rejects on a backgrounded tab or a stricter gesture policy. Both
          // leave the poster up, which is the right fallback, so there is nothing to do.
          void el.play().catch(() => {});
        } else {
          el.pause();
        }
      },
      // Most of the slide, not a sliver of it: a neighbouring carousel slide peeking in
      // at the edge of the frame should not count as the shopper having arrived.
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      title={title}
      controls
      muted
      playsInline
      preload="none"
      onEnded={onEnded}
      className={className}
    />
  );
}
