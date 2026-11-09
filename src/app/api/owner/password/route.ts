import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireOwner, logAudit, UnauthorizedError } from "@/lib/auth/session";
import { hashPassword, verifyPassword } from "@/lib/auth/password";

const Schema = z.object({
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z
    .string()
    .min(12, "Use at least 12 characters")
    .max(200, "That password is too long for our hasher"),
});

/** Password change — requires the current password, rotates every other session. */
export async function POST(req: Request) {
  let owner;
  try {
    owner = await requireOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
    throw e;
  }

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: parsed.error.issues[0]?.message ?? "Invalid input.",
        fields: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])),
      },
      { status: 422 },
    );
  }

  const user = await db.user.findUnique({ where: { id: owner.id } });
  if (!user) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  if (!(await verifyPassword(user.passwordHash, parsed.data.currentPassword))) {
    return NextResponse.json({ error: "Your current password is incorrect.", fields: { currentPassword: "Incorrect." } }, { status: 403 });
  }

  if (parsed.data.newPassword === parsed.data.currentPassword) {
    return NextResponse.json({ error: "Choose a new password that differs from the current one." }, { status: 422 });
  }

  await db.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword), mustChangePassword: false },
  });

  // Kill all other sessions so an old token cannot survive the rotation.
  await db.session.deleteMany({ where: { userId: user.id } });

  // Re-issue this session's cookie by creating a fresh one.
  const { createSession, setSessionCookie } = await import("@/lib/auth/session");
  const session = await createSession(user.id, { userAgent: req.headers.get("user-agent") ?? undefined });
  await setSessionCookie(session.token, session.expiresAt);

  await logAudit({ userId: user.id, action: "password.change", entity: "User", entityId: user.id });

  return NextResponse.json({ ok: true, message: "Password updated. Other devices were signed out." });
}
