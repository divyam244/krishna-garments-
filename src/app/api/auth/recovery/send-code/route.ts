import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmailOtp } from "@/lib/auth/customer";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { devStore } from "@/lib/auth/dev-store";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rate = await checkRateLimit(`recovery-send:${ip}`, 5, 60_000);
    if (!rate.ok) {
      return NextResponse.json({ error: "Too many recovery attempts. Please wait." }, { status: 429 });
    }

    const { identifier } = await req.json();
    const clean = (identifier || "").trim();

    if (!clean) {
      return NextResponse.json({ error: "Please enter your mobile number or email." }, { status: 400 });
    }

    // Look up customer by phone or email
    const cleanPhone = clean.replace(/\D+/g, "");
    let customer: any = null;
    try {
      customer = await db.customer.findFirst({
        where: {
          OR: [
            { email: clean.toLowerCase() },
            ...(cleanPhone.length >= 10 ? [{ phone: cleanPhone }] : []),
          ],
        },
      });
    } catch {
      customer = devStore.findCustomerByEmail(clean) || (cleanPhone.length >= 10 ? devStore.findCustomerByPhone(cleanPhone) : null);
    }

    if (!customer || !customer.email || !customer.emailVerified) {
      return NextResponse.json(
        { error: "No verified account found matching these details." },
        { status: 404 },
      );
    }

    const result = await sendEmailOtp(customer.email, "LOGIN_RECOVERY", customer.id);

    if (!result.success) {
      return NextResponse.json({ error: result.error || "Failed to send recovery code." }, { status: 500 });
    }

    // Mask email for user hint
    const [user, domain] = customer.email.split("@");
    const masked = `${user.slice(0, 2)}***@${domain}`;

    return NextResponse.json({
      ok: true,
      message: `Recovery code sent to your verified email: ${masked}`,
      email: customer.email,
      maskedEmail: masked,
      simulated: result.simulated,
    });
  } catch (err) {
    console.error("[Recovery Send Code API] Error:", err);
    return NextResponse.json({ error: "Failed to send recovery code." }, { status: 500 });
  }
}

