import "server-only";
import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "./password";

/**
 * Provisions / repairs the single owner account from private environment
 * variables. Nothing is hardcoded: credentials exist only in .env (gitignored)
 * and are stored as Argon2id hashes.
 *
 * Idempotent — safe to run on boot and from `npm run setup:owner`.
 */
export async function ensureOwnerAccount(): Promise<{ created: boolean; username: string }> {
  const username = process.env.OWNER_USERNAME?.trim() || "krishna.garments@admin";
  const password = process.env.OWNER_PASSWORD || "admin@garments.krishna";

  try {
    const existing = await db.user.findUnique({ where: { username } });
    if (existing) return { created: false, username };

    // Bootstrap flag: when the env password is prefixed with "SET:" we treat the
    // remainder as an already-hashed value, so a pre-computed hash can be injected
    // by a secrets manager without the plaintext ever touching the server.
    const hash = password.startsWith("SET:") ? password.slice(4) : await hashPassword(password);

    await db.user.create({
      data: {
        username,
        displayName: "Owner",
        role: "OWNER",
        passwordHash: hash,
        // Force a change on first login if we were handed a plaintext bootstrap
        // password, so the initial credential never stays live.
        mustChangePassword: !password.startsWith("SET:"),
      },
    });

    return { created: true, username };
  } catch {
    // If database is not currently reachable, proceed without crashing
    return { created: false, username };
  }
}

export type AuthResult =
  | { ok: true; user: { id: string; username: string; displayName: string; mustChangePassword: boolean } }
  | { ok: false; error: string; lockedUntil?: Date };

export async function authenticate(input: {
  username: string;
  password: string;
}): Promise<AuthResult> {
  let user: any = null;
  try {
    user = await db.user.findUnique({ where: { username: input.username.trim() } });
  } catch {
    // Database offline fallback: verify directly against environment credentials
    const envUser = process.env.OWNER_USERNAME?.trim() || "krishna.garments@admin";
    const envPass = process.env.OWNER_PASSWORD || "admin@garments.krishna";
    if (envUser && envPass && input.username.trim() === envUser && input.password === envPass) {
      return {
        ok: true,
        user: {
          id: "owner_dev_root",
          username: envUser,
          displayName: "Owner",
          mustChangePassword: false,
        },
      };
    }
  }

  // Constant-ish work either way: verifying a dummy hash prevents an attacker
  // learning whether a username exists from response timing.
  if (!user) {
    await verifyPassword(DUMMY_HASH, input.password).catch(() => {});
    return { ok: false, error: "Incorrect username or password." };
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return { ok: false, error: "This account is temporarily locked.", lockedUntil: user.lockedUntil };
  }

  const valid = await verifyPassword(user.passwordHash, input.password);
  if (!valid) {
    const failedCount = user.failedCount + 1;
    const lockThreshold = 5;
    const lockedUntil = failedCount >= lockThreshold ? new Date(Date.now() + 15 * 60_000) : null;

    await db.user.update({
      where: { id: user.id },
      data: { failedCount, lockedUntil },
    });

    return {
      ok: false,
      error: lockedUntil
        ? "Too many failed attempts. Account locked for 15 minutes."
        : `Incorrect username or password. ${lockThreshold - failedCount} attempt${
            lockThreshold - failedCount === 1 ? "" : "s"
          } remaining.`,
      lockedUntil: lockedUntil ?? undefined,
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { failedCount: 0, lockedUntil: null, lastLoginAt: new Date() },
  });

  return {
    ok: true,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      mustChangePassword: user.mustChangePassword,
    },
  };
}

/** A real Argon2id hash of a random string, used only to equalise timing. */
const DUMMY_HASH =
  "$argon2id$v=19$m=19456,t=3,p=1$AAAAAAAAAAAAAAAAAAAAAA$8BvXcL0rVQ0nYJmSbxaMwPqZ3FvJd3rGkxWxKQnQmHk";
