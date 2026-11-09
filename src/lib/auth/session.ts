import "server-only";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { cache } from "react";
import { db } from "@/lib/db";

export const SESSION_COOKIE = "kg_owner_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 8; // 8 hours
const IDLE_SLIDING = true;

export type OwnerUser = {
  id: string;
  username: string;
  displayName: string;
  role: string;
  mustChangePassword: boolean;
};

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Creates a DB-backed session and returns the raw token (only ever sent to the client). */
export async function createSession(
  userId: string,
  req: { ip?: string; userAgent?: string },
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.session.create({
    data: {
      tokenHash: hashToken(token),
      userId,
      expiresAt,
      ipHash: req.ip ? hashToken(req.ip).slice(0, 32) : null,
      userAgent: req.userAgent?.slice(0, 255) ?? null,
    },
  });

  return { token, expiresAt };
}

export async function setSessionCookie(token: string, expiresAt: Date) {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroyCurrentSession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  jar.delete(SESSION_COOKIE);
}

/**
 * Resolves the authenticated owner for this request, or null.
 * Wrapped in React `cache` so layout + page + API in one render share one lookup.
 */
export const getCurrentOwner = cache(async (): Promise<OwnerUser | null> => {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: { user: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  // Sliding expiry: refresh long-lived dashboards without forcing re-login.
  if (IDLE_SLIDING && session.expiresAt.getTime() - Date.now() < SESSION_TTL_MS / 2) {
    await db.session
      .update({ where: { id: session.id }, data: { expiresAt: new Date(Date.now() + SESSION_TTL_MS) } })
      .catch(() => {});
  }

  const u = session.user;
  return {
    id: u.id,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    mustChangePassword: u.mustChangePassword,
  };
});

export async function requireOwner(): Promise<OwnerUser> {
  const owner = await getCurrentOwner();
  if (!owner) throw new UnauthorizedError();
  return owner;
}

export class UnauthorizedError extends Error {
  constructor() {
    super("Authentication required");
    this.name = "UnauthorizedError";
  }
}

export async function logAudit(entry: {
  userId?: string | null;
  action: string;
  entity: string;
  entityId?: string | null;
  detail?: string | null;
}) {
  await db.auditLog.create({ data: entry }).catch(() => {
    // Audit failure must never break a business operation.
  });
}
