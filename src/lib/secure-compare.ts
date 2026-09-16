import crypto from "crypto";

/**
 * Constant-time string comparison — guards secret checks (SETUP_SECRET,
 * webhook signatures) against timing attacks that a plain `===` can leak
 * a byte at a time. Returns false immediately on any falsy/mismatched
 * length input without touching timingSafeEqual (which throws on unequal
 * buffer lengths).
 */
export function secureCompare(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
