import crypto from "crypto";

/** Returns a random token to hand to the user (in the reset link) plus the
 * SHA-256 hash of it to store in the database — the raw token is never
 * persisted, mirroring how session/API tokens should be handled. */
export function generateToken(): { token: string; hash: string } {
  const token = crypto.randomBytes(32).toString("hex");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  return { token, hash };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
