#!/usr/bin/env node
/**
 * Cloudinary credential check.
 *
 * "Invalid Signature" from an upload is close to undiagnosable from the error alone:
 * Cloudinary echoes back a string-to-sign that matches ours exactly, which makes it look
 * like a parameter bug when it is really the API secret. The signature is
 * sha1(sortedParams + secret), so the params can be perfect and it still fails if the
 * secret does not belong to the api_key being sent.
 *
 * This asks Cloudinary directly instead of guessing: /usage authenticates the
 * cloud_name + api_key + api_secret triple with HTTP Basic auth, so a 200 means the
 * credentials are genuinely valid and a 401 means they are not — no uploading, no
 * signing, no ambiguity.
 *
 * Usage:
 *   node scripts/check-cloudinary.mjs
 *   node scripts/check-cloudinary.mjs --cloud xxx --key 1234 --secret abcd
 *
 * Optionally verify against a real failure, straight from the admin's error toast:
 *   node scripts/check-cloudinary.mjs --expect 0e152bd2... --timestamp 1787640313
 *
 * Values are never printed — only lengths and a short fingerprint.
 */

import { createHash } from "crypto";
import { readFileSync } from "fs";

/* ── config ────────────────────────────────────────────────────────────────── */

const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};

/** .env is not auto-loaded by plain node, and these are server-only vars that never
 *  reach the Vite client bundle, so read the file directly. */
function fromEnvFile(file) {
  const out = {};
  try {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(line);
      if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  } catch {
    /* file absent — fine */
  }
  return out;
}

const fileEnv = { ...fromEnvFile(".env"), ...fromEnvFile(".env.local") };
const pick = (name, flag) => arg(flag) ?? process.env[name] ?? fileEnv[name] ?? "";

// Deliberately NOT trimmed here — detecting stray whitespace is half the point.
const cloud = pick("CLOUDINARY_CLOUD_NAME", "cloud");
const key = pick("CLOUDINARY_API_KEY", "key");
const secret = pick("CLOUDINARY_API_SECRET", "secret");
const folder = pick("CLOUDINARY_FOLDER", "folder") || "products";

/* ── 1. what we actually have ──────────────────────────────────────────────── */

const fingerprint = (v) => (v ? createHash("sha1").update(v).digest("hex").slice(0, 8) : "—");
const flag = (v) => (v !== v.trim() ? "  ⚠ HAS LEADING/TRAILING WHITESPACE" : "");

console.log("Credentials found");
console.log("─".repeat(64));
for (const [name, value] of [
  ["CLOUDINARY_CLOUD_NAME", cloud],
  ["CLOUDINARY_API_KEY", key],
  ["CLOUDINARY_API_SECRET", secret],
]) {
  const shown = name.endsWith("SECRET") ? `${value.length} chars, fp:${fingerprint(value)}` : value || "(empty)";
  console.log(`  ${name.padEnd(24)} ${value ? shown : "(EMPTY)"}${flag(value)}`);
}
console.log(`  ${"CLOUDINARY_FOLDER".padEnd(24)} ${folder}`);
console.log("");

if (!cloud || !key || !secret) {
  console.log("✗ One or more values are empty. Nothing else can be checked.");
  process.exit(1);
}

/* ── 2. ask Cloudinary whether the triple is valid ─────────────────────────── */

const auth = Buffer.from(`${key.trim()}:${secret.trim()}`).toString("base64");
let credentialsValid = false;

try {
  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloud.trim()}/usage`, {
    headers: { Authorization: `Basic ${auth}` },
  });
  console.log("Cloudinary authentication");
  console.log("─".repeat(64));
  if (res.ok) {
    credentialsValid = true;
    console.log("  ✓ VALID — cloud name, API key and API secret belong together.");
  } else {
    const text = await res.text().catch(() => "");
    console.log(`  ✗ REJECTED (HTTP ${res.status})`);
    console.log(`    ${text.slice(0, 200)}`);
    console.log("");
    console.log("  This triple is wrong. Most likely one of:");
    console.log("    • the API secret was regenerated in Cloudinary and Vercel still has the old one");
    console.log("    • the API key and secret come from different Cloudinary accounts");
    console.log("    • the cloud name belongs to a different account than the key");
  }
} catch (err) {
  console.log(`  ✗ Could not reach Cloudinary: ${err.message}`);
}
console.log("");

/* ── 3. optionally reproduce the exact failing signature ───────────────────── */

const expect = arg("expect");
if (expect) {
  // Exactly the params api/admin/images.ts signs for an image upload.
  const timestamp = arg("timestamp") || String(Math.floor(Date.now() / 1000));
  const params = {
    allowed_formats: "jpg,jpeg,png,webp,avif",
    folder: folder.trim(),
    timestamp,
    transformation: "c_limit,w_2000,h_2000,q_auto",
  };
  const toSign = Object.keys(params).sort().map((k) => `${k}=${params[k]}`).join("&");
  const ours = createHash("sha1").update(toSign + secret.trim()).digest("hex");

  console.log("Signature reproduction");
  console.log("─".repeat(64));
  console.log(`  string to sign : ${toSign}`);
  console.log(`  ours           : ${ours}`);
  console.log(`  Cloudinary's   : ${expect}`);
  console.log(
    ours === expect
      ? "  ✓ MATCH — this secret is the right one; the deployed environment has a different value."
      : "  ✗ MISMATCH — the secret used here is not the one Cloudinary expects for that api_key."
  );
  console.log("");
}

console.log(credentialsValid ? "Next: make sure Vercel holds exactly these values, then redeploy." : "Fix the credentials above, then redeploy.");
