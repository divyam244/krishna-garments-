import { NextResponse } from "next/server";
import { getPasskeyLoginOptions } from "@/lib/auth/webauthn";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rate = await checkRateLimit(`login-opts:${ip}`, 15, 60_000);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many attempts. Please wait." }, { status: 429 });
    }

    const { phone } = await req.json();
    const cleanPhone = (phone || "").trim().replace(/\D+/g, "");

    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please enter your registered 10-digit mobile number." }, { status: 400 });
    }

    const result = await getPasskeyLoginOptions(cleanPhone);

    if ("error" in result && !("options" in result)) {
      return NextResponse.json(
        {
          error: result.error,
          hasPasskey: result.hasPasskey,
          email: result.email ? maskEmail(result.email) : undefined,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("[Passkey Login Options API] Error:", err);
    return NextResponse.json({ error: "Failed to initialize passkey login." }, { status: 500 });
  }
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const maskedUser = user.length <= 2 ? `${user[0]}*` : `${user[0]}***${user[user.length - 1]}`;
  return `${maskedUser}@${domain}`;
}

