import { createHash } from "crypto";

/**
 * PayU (India) hash helpers.
 * Docs: https://docs.payu.in/docs/hash-generation
 *
 * These are intentionally written as arrays joined with "|" rather than hand-typed
 * pipe strings — PayU's format has a fixed number of empty udf6..udf10 placeholder
 * fields and it's very easy to get the pipe count wrong by hand.
 */

export type PayuMode = "test" | "production";

export const PAYU_ACTION_URL: Record<PayuMode, string> = {
  test: "https://test.payu.in/_payment",
  production: "https://secure.payu.in/_payment",
};

export function getPayuMode(): PayuMode {
  return (process.env.PAYU_MODE || "test").toLowerCase() === "production" ? "production" : "test";
}

export function isPayuConfigured(): boolean {
  return Boolean(process.env.PAYU_MERCHANT_KEY && process.env.PAYU_SALT);
}

export type PayuFields = {
  key: string;
  txnid: string;
  amount: string; // e.g. "499.00"
  productinfo: string;
  firstname: string;
  email: string;
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
};

/** Forward hash — sent to PayU when opening the hosted payment page. */
export function generatePayuHash(fields: PayuFields, salt: string): string {
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
export function verifyPayuResponseHash(
  fields: PayuFields & { status: string; hash: string },
  salt: string
): boolean {
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
export function generateTxnId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `itr${Date.now()}${rand}`.slice(0, 30);
}
