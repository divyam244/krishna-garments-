import "server-only";
import { hash, verify, type Options } from "@node-rs/argon2";

/**
 * Argon2id parameters — OWASP 2024 baseline (m >= 64 MiB, t >= 3, p >= 1).
 * Tuned down slightly on memory so the dashboard still runs on small VPS hosts.
 */
const ARGON2_OPTIONS: Options = {
  algorithm: 2, // argon2id
  memoryCost: 19_456, // KiB (~19 MB)
  timeCost: 3,
  outputLen: 32,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return hash(plain, ARGON2_OPTIONS);
}

export async function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  try {
    return await verify(hashed, plain);
  } catch {
    // Malformed/stale hash in the database must never throw through login.
    return false;
  }
}
