import { NextResponse } from "next/server";
import { verifyPasskeyLogin } from "@/lib/auth/webauthn";
import { createCustomerSession } from "@/lib/auth/customer";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const { customerId, response } = await req.json();

    if (!customerId || !response) {
      return NextResponse.json({ error: "Missing login verification data." }, { status: 400 });
    }

    const result = await verifyPasskeyLogin(customerId, response);

    if (!result.verified || !result.customer) {
      return NextResponse.json({ error: result.error || "Authentication failed." }, { status: 401 });
    }

    const ip = clientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || undefined;
    await createCustomerSession(result.customer.id, { ip, userAgent });

    return NextResponse.json({
      ok: true,
      message: "Login successful.",
      redirectTo: "/account",
      customer: {
        id: result.customer.id,
        name: result.customer.name,
        email: result.customer.email,
        phone: result.customer.phone,
      },
    });
  } catch (err) {
    console.error("[Verify Passkey Login API] Error:", err);
    return NextResponse.json({ error: "Login verification failed." }, { status: 500 });
  }
}

