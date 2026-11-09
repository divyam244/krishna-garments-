import { NextResponse } from "next/server";
import { z } from "zod";
import { authenticate, ensureOwnerAccount } from "@/lib/auth/owner";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const Schema = z.object({
  username: z.string().trim().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

export async function POST(req: Request) {
  const ip = clientIp(req.headers);

  // Two layers: a tight per-IP window plus the per-account lockout in authenticate().
  const rl = await checkRateLimit(`login:${ip}`, 8, 5 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many sign-in attempts. Try again in ${rl.retryAfterSec} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Enter both username and password.", fields: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0]), i.message])) },
      { status: 422 },
    );
  }

  try {
    await ensureOwnerAccount();
  } catch (e) {
    console.error("[owner/login] bootstrap failed:", (e as Error).message);
    return NextResponse.json(
      { error: "Owner authentication is not configured on this server yet." },
      { status: 503 },
    );
  }

  const result = await authenticate(parsed.data);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 401 });
  }

  const session = await createSession(result.user.id, {
    ip,
    userAgent: req.headers.get("user-agent") ?? undefined,
  });
  await setSessionCookie(session.token, session.expiresAt);

  return NextResponse.json({
    ok: true,
    mustChangePassword: result.user.mustChangePassword,
    redirectTo: result.user.mustChangePassword ? "/owner/settings#password" : "/owner",
  });
}
