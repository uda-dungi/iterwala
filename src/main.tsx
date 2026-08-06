import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import { initPixel } from "./lib/pixel";
import "./index.css";

// Loads the Meta Pixel and fires the first PageView. No-ops entirely when
// VITE_META_PIXEL_ID isn't set, so dev/preview builds send nothing.
initPixel();

createRoot(document.getElementById("root")!).render(<App />);
