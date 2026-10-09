import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initPixel } from "./lib/pixel";
import "./index.css";

// Loads the Meta Pixel and fires the first PageView. No-ops entirely when
// VITE_META_PIXEL_ID isn't set, so dev/preview builds send nothing.
initPixel();

createRoot(document.getElementById("root")!).render(<App />);

// Every deploy renames the hashed /assets files. A tab (or cached page) opened before a
// deploy keeps requesting the old names, which now 404 — product tiles turn into broken
// images until a manual refresh. When an asset fails, check whether the live index.html
// points at a different entry bundle; if so, reload once to pick up the new build.
window.addEventListener(
  "error",
  (e) => {
    const t = e.target as HTMLElement | null;
    const src = t instanceof HTMLImageElement ? t.currentSrc : t instanceof HTMLScriptElement ? t.src : "";
    if (!src || !src.includes("/assets/")) return;
    try { if (sessionStorage.getItem("itr_stale_reload")) return; } catch { return; }
    fetch("/", { cache: "no-store" })
      .then((r) => r.text())
      .then((html) => {
        const live = html.match(/\/assets\/index-[\w-]+\.js/)?.[0];
        const mine = document.querySelector<HTMLScriptElement>('script[src*="/assets/index-"]')?.getAttribute("src");
        if (live && mine && !mine.endsWith(live)) {
          try { sessionStorage.setItem("itr_stale_reload", "1"); } catch { /* ignore */ }
          location.reload();
        }
      })
      .catch(() => {});
  },
  true,
);
