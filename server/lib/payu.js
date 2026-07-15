import { createHash } from "crypto";

/**
 * PayU (India) hash helpers — plain-JS port of api/_lib/payu.ts for the Hostinger
 * Node.js server (server/index.js). Keep this in sync with api/_lib/payu.ts if that
 * file is ever edited; api/ is left in place only as a reference for a possible
 * future Vercel deploy and is NOT used by the Hostinger server.
 * Docs: https://docs.payu.in/docs/hash-generation
 */

export const PAYU_ACTION_URL = {
  test: "https://test.payu.in/_payment",
  production: "https://secure.payu.in/_payment",
};

export function getPayuMode() {
  return (process.env.PAYU_MODE || "test").toLowerCase() === "production" ? "production" : "test";
}

export function isPayuConfigured() {
  return Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_SALT);
}

/** Forward hash — sent to PayU when opening the hosted payment page. */
export function generatePayuHash(fields, salt) {
  const seq = [
    fields.key,
    fields.txnid,
    fields.amount,
    fields.productinfo,
    fields.firstname,
    fields.email,
    fields.udf1 || "",
    fields.udf2 || "",
    fields.udf3 || "",
    fields.udf4 || "",
    fields.udf5 || "",
    "", "", "", "", // udf6..udf9 (unused, always empty)
    "", // udf10 (unused, always empty)
  ];
  return createHash("sha512").update(seq.join("|") + "|" + salt).digest("hex");
}

/** Reverse hash — used to verify PayU's success/failure postback wasn't tampered with. */
export function verifyPayuResponseHash(fields, salt) {
  const seq = [
    salt,
    fields.status,
    "", // udf10
    "", "", "", "", // udf9..udf6
    fields.udf5 || "",
    fields.udf4 || "",
    fields.udf3 || "",
    fields.udf2 || "",
    fields.udf1 || "",
    fields.email,
    fields.firstname,
    fields.productinfo,
    fields.amount,
    fields.txnid,
    fields.key,
  ];
  const expected = createHash("sha512").update(seq.join("|")).digest("hex");
  return expected === fields.hash;
}

/** Unique-enough transaction id PayU will accept (alphanumeric, <= 30 chars). */
export function generateTxnId() {
  const rand = Math.random().toString(36).slice(2, 10);
  return `itr${Date.now()}${rand}`.slice(0, 30);
}
