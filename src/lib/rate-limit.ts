import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres.
 * Chosen over in-memory so limits survive serverless restarts and hold across
 * multiple instances — important for the owner login endpoint.
 */
export type RateResult = { ok: boolean; remaining: number; retryAfterSec: number };

export async function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
): Promise<RateResult> {
  const now = Date.now();
  const resetAt = new Date(now + windowMs);

  try {
    const row = await db.rateLimitBucket.findUnique({ where: { key } });

    if (!row || row.resetAt.getTime() < now) {
      await db.rateLimitBucket.upsert({
        where: { key },
        create: { key, count: 1, resetAt },
        update: { count: 1, resetAt },
      });
      return { ok: true, remaining: limit - 1, retryAfterSec: 0 };
    }

    if (row.count >= limit) {
      return {
        ok: false,
        remaining: 0,
        retryAfterSec: Math.ceil((row.resetAt.getTime() - now) / 1000),
      };
    }

    await db.rateLimitBucket.update({ where: { key }, data: { count: { increment: 1 } } });
    return { ok: true, remaining: limit - row.count - 1, retryAfterSec: 0 };
  } catch {
    // If the limiter table is unavailable, fail closed on auth-sensitive keys
    // and open on bulk read endpoints.
    return { ok: !key.startsWith("login:"), remaining: 0, retryAfterSec: 60 };
  }
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
