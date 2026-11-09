import { NextResponse } from "next/server";
import { sendEmailOtp } from "@/lib/auth/customer";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rate = await checkRateLimit(`resend-otp:${ip}`, 5, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: `Too many OTP requests. Please wait ${rate.retryAfterSec}s.` },
        { status: 429 },
      );
    }

    const { email, type = "EMAIL_VERIFY" } = await req.json();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).trim())) {
      return NextResponse.json({ error: "Valid email is required." }, { status: 400 });
    }

    const res = await sendEmailOtp(
      String(email).trim().toLowerCase(),
      type === "LOGIN_RECOVERY" ? "LOGIN_RECOVERY" : "EMAIL_VERIFY",
    );

    if (!res.success) {
      return NextResponse.json(
        { error: res.error || "Failed to resend code." },
        { status: res.cooldownSeconds ? 429 : 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: "A new verification code has been sent to your email.",
      simulated: res.simulated,
    });
  } catch (err) {
    console.error("[Resend OTP API] Error:", err);
    return NextResponse.json({ error: "Failed to resend code." }, { status: 500 });
  }
}

