import fs from "node:fs";
import path from "node:path";
import type { Plugin, ViteDevServer } from "vite";
import { loadEnv } from "vite";

/**
 * Runs the /api folder inside `npm run dev`.
 *
 * On Vercel every file in /api is deployed as its own serverless function, so the
 * browser can POST to /api/checkout/initiate and get JSON back. Plain `vite` knows
 * nothing about that folder — the SPA fallback answered /api/* with index.html, so
 * `await res.json()` in Checkout.tsx threw on "<!doctype html>" and the PayU redirect
 * silently turned into a "Network error" toast. This plugin closes that gap by
 * resolving /api/<route> to api/<route>.ts and invoking its default export with a
 * Vercel-shaped (req, res) pair.
 */

const API_DIR = "api";

/** Map a URL path to a handler file, mirroring Vercel's filesystem routing. */
function resolveHandlerFile(root: string, urlPath: string): string | null {
  // "/api/checkout/initiate" -> "checkout/initiate"
  const rel = urlPath.replace(/^\/api\/?/, "").replace(/\/+$/, "");
  if (!rel) return null;

  // Vercel never exposes files/folders prefixed with "_" as routes (that's how
  // api/_lib stays private). Reject those, and anything trying to escape the folder.
  const segments = rel.split("/");
  if (segments.some((s) => !s || s.startsWith("_") || s === "." || s === "..")) return null;

  for (const candidate of [`${rel}.ts`, `${rel}.js`, `${rel}/index.ts`, `${rel}/index.js`]) {
    const full = path.join(root, API_DIR, candidate);
    if (fs.existsSync(full)) return full;
  }
  return null;
}

function readBody(req: any): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (c: Buffer) => chunks.push(c));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

/** Give the raw Node response the `.status().json()` / `.send()` sugar Vercel provides. */
function decorateResponse(res: any) {
  res.status = (code: number) => {
    res.statusCode = code;
    return res;
  };
  res.json = (payload: unknown) => {
    if (!res.headersSent) res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.end(JSON.stringify(payload));
    return res;
  };
  res.send = (payload: any) => {
    if (payload === undefined || payload === null) return res.end();
    if (typeof payload === "object" && !Buffer.isBuffer(payload)) return res.json(payload);
    if (!res.headersSent && !res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "text/html; charset=utf-8");
    }
    res.end(payload);
    return res;
  };
  res.redirect = (statusOrUrl: number | string, maybeUrl?: string) => {
    const code = typeof statusOrUrl === "number" ? statusOrUrl : 302;
    const url = typeof statusOrUrl === "number" ? maybeUrl : statusOrUrl;
    res.writeHead(code, { Location: url });
    res.end();
    return res;
  };
  return res;
}

export function apiDevServer(mode: string): Plugin {
  return {
    name: "itrawala:api-dev-server",
    apply: "serve",

    configResolved(config) {
      // Serverless functions read secrets off process.env (PAYU_MERCHANT_KEY,
      // PAYU_SALT, SUPABASE_SERVICE_ROLE_KEY, ...). Vite only exposes VITE_-prefixed
      // vars to the client bundle and never touches process.env, so load the whole
      // .env here — the third argument "" disables the prefix filter.
      const env = loadEnv(mode, config.root, "");
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value;
      }
    },

    configureServer(server: ViteDevServer) {
      server.middlewares.use(async (req: any, res: any, next: any) => {
        const url = req.url || "";
        if (!url.startsWith("/api/") && url !== "/api") return next();

        const [pathname, search = ""] = url.split("?");
        const file = resolveHandlerFile(server.config.root, pathname);
        if (!file) {
          res.statusCode = 404;
          res.setHeader("Content-Type", "application/json; charset=utf-8");
          res.end(JSON.stringify({ error: `No API route for ${pathname}` }));
          return;
        }

        try {
          const raw = ["GET", "HEAD"].includes(req.method) ? "" : await readBody(req);
          const contentType = String(req.headers["content-type"] || "");

          if (!raw) {
            req.body = undefined;
          } else if (contentType.includes("application/json")) {
            try {
              req.body = JSON.parse(raw);
            } catch {
              req.body = raw;
            }
          } else if (contentType.includes("application/x-www-form-urlencoded")) {
            // This is the branch PayU uses when it posts the payment result to
            // /api/payu/callback.
            req.body = Object.fromEntries(new URLSearchParams(raw));
          } else {
            req.body = raw;
          }

          req.query = Object.fromEntries(new URLSearchParams(search));
          decorateResponse(res);

          // ssrLoadModule transpiles the .ts handler on the fly and honours HMR, so
          // edits to api/* take effect without restarting the dev server.
          const mod = await server.ssrLoadModule(file);
          const handler = mod.default;
          if (typeof handler !== "function") {
            throw new Error(`${path.relative(server.config.root, file)} has no default export handler`);
          }
          await handler(req, res);
        } catch (err) {
          server.config.logger.error(`[api] ${pathname} failed`);
          console.error(err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("Content-Type", "application/json; charset=utf-8");
          }
          if (!res.writableEnded) {
            res.end(JSON.stringify({ error: (err as Error)?.message || "API handler crashed" }));
          }
        }
      });
    },
  };
}
