import { useEffect, useState, type ReactNode } from "react";

/**
 * Mounts its children after first paint instead of with the rest of the page.
 *
 * The homepage is ~1,900 DOM nodes; rendering all of it in the first React commit makes
 * the browser style/layout/script the whole thing before it can show the hero. Anything
 * far below the fold can wait: it mounts when the main thread goes idle, or the moment
 * the visitor starts scrolling/touching, whichever comes first. A tall placeholder keeps
 * the scrollbar and anchor positions roughly where they will end up.
 */
export function Deferred({ children, minHeight = "150vh" }: { children: ReactNode; minHeight?: string }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (ready) return;
    const go = () => setReady(true);
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number };
    const idle = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 3000 }) : window.setTimeout(go, 1500);
    const events = ["scroll", "touchstart", "pointerdown", "keydown"] as const;
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }));
    // A #hash link (e.g. /#reviews) targets something inside the deferred block.
    if (window.location.hash) go();
    return () => {
      events.forEach((e) => window.removeEventListener(e, go));
      if (w.requestIdleCallback && (window as Window & { cancelIdleCallback?: (n: number) => void }).cancelIdleCallback) {
        (window as Window & { cancelIdleCallback: (n: number) => void }).cancelIdleCallback(idle);
      } else {
        window.clearTimeout(idle);
      }
    };
  }, [ready]);

  return ready ? <>{children}</> : <div style={{ minHeight }} aria-hidden="true" />;
}
