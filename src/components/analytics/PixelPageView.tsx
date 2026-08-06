import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/pixel";

/**
 * Fires a Meta PageView on every client-side route change.
 *
 * This site is a single-page app: after the first load React Router swaps pages
 * without a real navigation, so Meta's pixel would only ever record ONE PageView
 * per session and undercount traffic badly. Renders nothing.
 *
 * The very first PageView is already sent by initPixel() in main.tsx, so the
 * initial mount is skipped here to avoid counting the landing page twice.
 */
export function PixelPageView() {
  const { pathname, search } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    trackPageView();
  }, [pathname, search]);

  return null;
}
