import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyEmailOtp, createCustomerSession } from "@/lib/auth/customer";
import { clientIp } from "@/lib/rate-limit";
import { devStore } from "@/lib/auth/dev-store";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, code, address } = body;

    if (!email || !code) {
      return NextResponse.json({ error: "Email and verification code are required." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const result = await verifyEmailOtp(normalizedEmail, String(code).trim(), "EMAIL_VERIFY");

    if (!result.valid) {
      return NextResponse.json({ error: result.error || "Invalid verification code." }, { status: 400 });
    }

    // Mark email as verified and account as ACTIVE
    let customer: any;
    try {
      customer = await db.customer.update({
        where: { email: normalizedEmail },
        data: {
          emailVerified: new Date(),
          phoneVerified: false, // Phone is account ID, not claimed verified without phone OTP
          accountStatus: "ACTIVE",
        },
      });
    } catch {
      const devC = devStore.findCustomerByEmail(normalizedEmail);
      customer = devStore.upsertCustomer({
        id: devC?.id,
        name: devC?.name || "Customer",
        email: normalizedEmail,
        phone: devC?.phone || "",
        emailVerified: new Date(),
        accountStatus: "ACTIVE",
      });
    }

    // Optionally save default delivery address if provided
    if (address && address.street && address.city) {
      try {
        await db.customerAddress.create({
          data: {
            customerId: customer.id,
            label: "Home",
            fullName: customer.name,
            phone: customer.phone || "",
            street: address.street.trim(),
            city: address.city.trim(),
            state: address.state?.trim() || "Delhi",
            pincode: address.pincode?.trim() || "",
            isDefault: true,
          },
        });
      } catch {
        devStore.createAddress({
          customerId: customer.id,
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state?.trim() || "Delhi",
          pincode: address.pincode?.trim() || "",
          isDefault: true,
        });
      }
    }

    // Create session cookie
    const ip = clientIp(req.headers);
    const userAgent = req.headers.get("user-agent") || undefined;
    await createCustomerSession(customer.id, { ip, userAgent });

    return NextResponse.json({
      ok: true,
      message: "Email verified successfully.",
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        emailVerified: customer.emailVerified,
      },
    });
  } catch (err) {
    console.error("[Verify OTP API] Error:", err);
    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 500 },
    );
  }
}

