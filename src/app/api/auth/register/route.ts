import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendEmailOtp } from "@/lib/auth/customer";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { devStore } from "@/lib/auth/dev-store";

export async function POST(req: Request) {
  try {
    const ip = clientIp(req.headers);
    const rate = await checkRateLimit(`register:${ip}`, 10, 60_000);
    if (!rate.ok) {
      return NextResponse.json(
        { error: `Too many registration attempts. Please wait ${rate.retryAfterSec}s.` },
        { status: 429 },
      );
    }

    const body = await req.json();
    const { name, email, phone, street, city, state, pincode } = body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }

    if (!email || typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json({ error: "Please provide a valid email address." }, { status: 400 });
    }

    const cleanPhone = (phone || "").trim().replace(/\D+/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json({ error: "Please provide a valid 10-digit mobile number." }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate email
    let existingEmail: any = null;
    let isDev = false;
    try {
      existingEmail = await db.customer.findUnique({
        where: { email: normalizedEmail },
      });
    } catch {
      isDev = true;
      existingEmail = devStore.findCustomerByEmail(normalizedEmail);
    }

    if (existingEmail && existingEmail.emailVerified) {
      return NextResponse.json(
        { error: "An account with this email address already exists. Please log in." },
        { status: 409 },
      );
    }

    // Check duplicate phone
    let existingPhone: any = null;
    if (isDev) {
      existingPhone = devStore.findCustomerByPhone(cleanPhone);
    } else {
      try {
        existingPhone = await db.customer.findUnique({
          where: { phone: cleanPhone },
        });
      } catch {
        isDev = true;
        existingPhone = devStore.findCustomerByPhone(cleanPhone);
      }
    }

    if (existingPhone && existingPhone.id !== existingEmail?.id) {
      return NextResponse.json(
        { error: "An account with this mobile number already exists. Please log in." },
        { status: 409 },
      );
    }

    // Upsert customer in unverified / pending state until code is verified
    let customer: { id: string };
    if (isDev) {
      customer = devStore.upsertCustomer({
        id: existingEmail?.id,
        name: name.trim(),
        email: normalizedEmail,
        phone: cleanPhone,
        accountStatus: "PENDING_VERIFICATION",
      });
    } else {
      try {
        if (existingEmail) {
          customer = await db.customer.update({
            where: { id: existingEmail.id },
            data: {
              name: name.trim(),
              phone: cleanPhone,
              accountStatus: "PENDING_VERIFICATION",
            },
          });
        } else {
          customer = await db.customer.create({
            data: {
              name: name.trim(),
              email: normalizedEmail,
              phone: cleanPhone,
              phoneVerified: false,
              accountStatus: "PENDING_VERIFICATION",
            },
          });
        }
      } catch {
        customer = devStore.upsertCustomer({
          id: existingEmail?.id,
          name: name.trim(),
          email: normalizedEmail,
          phone: cleanPhone,
          accountStatus: "PENDING_VERIFICATION",
        });
      }
    }

    // Send verification code using EmailJS
    const otpResult = await sendEmailOtp(normalizedEmail, "EMAIL_VERIFY", customer.id);

    if (!otpResult.success) {
      return NextResponse.json(
        { error: otpResult.error || "Failed to send verification email. Please try again." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      message: `Verification code sent to ${normalizedEmail}`,
      email: normalizedEmail,
      phone: cleanPhone,
      simulated: otpResult.simulated,
    });
  } catch (err) {
    console.error("[Register API] Error:", err);
    return NextResponse.json(
      { error: "An error occurred during registration. Please try again." },
      { status: 500 },
    );
  }
}

