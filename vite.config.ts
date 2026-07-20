import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { apiDevServer } from "./vite-api-dev";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    open: true,
  },
  // apiDevServer serves the /api folder during `npm run dev`; on Vercel those same
  // files are deployed as serverless functions, so the plugin is dev-only.
  plugins: [react(), apiDevServer(mode)],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
