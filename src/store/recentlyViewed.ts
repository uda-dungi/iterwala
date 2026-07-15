import { useEffect, useState } from "react";

const KEY = "itr_recently_viewed";
const MAX = 8;

const read = (): string[] => {
  try { return JSON.parse(localStorage.getItem(KEY) || "[]"); } catch { return []; }
};

/** Record a product as viewed (most-recent first, deduped, capped). */
export const recordView = (id: string) => {
  const next = [id, ...read().filter(x => x !== id)].slice(0, MAX);
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("itr-recent-updated"));
};

/** Reactive list of recently-viewed product ids. */
export const useRecentlyViewed = () => {
  const [ids, setIds] = useState<string[]>(read);
  useEffect(() => {
    const sync = () => setIds(read());
    window.addEventListener("itr-recent-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("itr-recent-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return ids;
};
