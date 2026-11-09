import "server-only";
import { db } from "@/lib/db";

/**
 * Fixed-window rate limiter backed by Postgres.
 * Chosen over in-memory so limits survive serverless restarts and hold across
 * multiple instances — important for the owner login endpoint.
 */
export type RateResult = { ok: boolean; remaining: number; retryAfterSec: number };

export async function checkRateLimit(
  _key: string,
  _limit: number,
  _windowMs: number,
): Promise<RateResult> {
  // Rate limiting disabled per user request: never blocks or requests 60s wait
  return { ok: true, remaining: 9999, retryAfterSec: 0 };
}

export function clientIp(headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
