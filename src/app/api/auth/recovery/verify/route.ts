import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyEmailOtp, createCustomerSession } from "@/lib/auth/customer";
import { clientIp } from "@/lib/rate-limit";
import { devStore } from "@/lib/auth/dev-store";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required." }, { status: 400 });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await verifyEmailOtp(normalizedEmail, String(code).trim(), "LOGIN_RECOVERY");

    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Invalid recovery code." }, { status: 400 });
    }

    let customer: any = null;
    try {
      customer = await db.customer.findUnique({
        where: { email: normalizedEmail },
      });
    } catch {
      customer = devStore.findCustomerByEmail(normalizedEmail);
    }

    if (!customer) {
      return NextResponse.json({ error: "Customer not found." }, { status: 404 });
    }

    const ip = clientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || undefined;
    await createCustomerSession(customer.id, { ip, userAgent });

    return NextResponse.json({
      ok: true,
      message: "Recovery successful. Welcome back!",
      redirectTo: "/account",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
      },
    });
  } catch (err) {
    console.error("[Recovery Verify API] Error:", err);
    return NextResponse.json({ error: "Recovery verification failed." }, { status: 500 });
  }
}

