import type { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { AppError } from "@/lib/errors";

/**
 * Sliding-window rate limit backed by Postgres (RateLimitAttempt), so it
 * stays correct across Vercel's independent serverless instances — an
 * in-memory counter would reset per-instance and not actually limit
 * anything in production.
 *
 * Call once per request with a key identifying what's being limited (e.g.
 * "login:ip:1.2.3.4" or "login:email:someone@example.com"). Throws
 * AppError(429) once the caller has made `max` attempts within
 * `windowMs`; otherwise records this attempt and returns.
 */
export async function enforceRateLimit(
  prisma: PrismaClient,
  key: string,
  opts: { max: number; windowMs: number }
) {
  const since = new Date(Date.now() - opts.windowMs);

  // Opportunistic cleanup of this key's own stale rows — keeps the table
  // small without needing a separate cron job.
  await prisma.rateLimitAttempt.deleteMany({ where: { key, createdAt: { lt: since } } });

  const count = await prisma.rateLimitAttempt.count({ where: { key, createdAt: { gte: since } } });
  if (count >= opts.max) {
    throw new AppError("Too many attempts. Please wait a few minutes and try again.", 429);
  }

  await prisma.rateLimitAttempt.create({ data: { key } });
}

/** Best-effort client IP from Vercel's forwarded-for header, falling back
 * to a constant so requests without one still share a (coarser) limit
 * rather than bypassing rate limiting entirely. */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}
