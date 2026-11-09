import { NextResponse } from "next/server";
import { getCurrentCustomer, createCustomerSession } from "@/lib/auth/customer";
import { verifyPasskeyRegistration } from "@/lib/auth/webauthn";
import { db } from "@/lib/db";
import { clientIp } from "@/lib/rate-limit";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { response, deviceName, customerId } = body;

    let targetCustomerId = customerId;
    if (!targetCustomerId) {
      const current = await getCurrentCustomer();
      targetCustomerId = current?.id;
    }

    if (!targetCustomerId) {
      return NextResponse.json({ error: "Customer identification required." }, { status: 401 });
    }

    const result = await verifyPasskeyRegistration(
      targetCustomerId,
      response,
      deviceName || "Biometric Passkey",
    );

    if (!result.verified) {
      return NextResponse.json({ error: result.error || "Passkey registration failed." }, { status: 400 });
    }

    // Ensure session is set
    const ip = clientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || undefined;
    await createCustomerSession(targetCustomerId, { ip, userAgent });

    return NextResponse.json({
      ok: true,
      message: "Passkey registered successfully! You can now log in using Face ID, fingerprint, or device PIN.",
    });
  } catch (err) {
    console.error("[Verify Passkey Registration API] Error:", err);
    return NextResponse.json({ error: "Failed to verify passkey registration." }, { status: 500 });
  }
}

