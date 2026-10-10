import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { apiDevServer } from "./vite-api-dev";
import { webpProductImages } from "./vite-webp-plugin";
import { trimCatalogSnapshot } from "./vite-trim-catalog-plugin";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: true,
  },
  // apiDevServer serves the /api folder during `npm run dev`; on Vercel those same
  // files are deployed as serverless functions, so the plugin is dev-only.
  plugins: [trimCatalogSnapshot(), react(), apiDevServer(mode), webpProductImages()],
  build: {
    rollupOptions: {
      output: {
        // Split third-party code out of the 1.1MB entry chunk so it downloads in
        // parallel and stays cached across deploys.
        manualChunks(id: string) {
          if (!id.includes("node_modules")) return undefined;
          if (/node_modules[\/](react|react-dom|react-router|react-router-dom|scheduler)[\/]/.test(id)) return "react";
          if (id.includes("framer-motion")) return "motion";
          if (id.includes("@supabase")) return "supabase";
          if (id.includes("@tanstack")) return "query";
          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
