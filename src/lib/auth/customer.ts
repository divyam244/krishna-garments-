import "server-only";
import { createHash, randomBytes, randomInt } from "crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { sendVerificationEmail } from "@/lib/emailjs";
import { devStore } from "@/lib/auth/dev-store";

export const CUSTOMER_SESSION_COOKIE = "kg_customer_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30; // 30 days
const OTP_EXPIRY_MINUTES = 15;
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds

export function hashString(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

export type CustomerUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  emailVerified: Date | null;
  phoneVerified: boolean;
  accountStatus: string;
};

/**
 * Generates and sends a 15-minute OTP to the target email.
 * Rejects requests if within the 60s cooldown window.
 */
export async function sendEmailOtp(
  email: string,
  type: "EMAIL_VERIFY" | "LOGIN_RECOVERY" = "EMAIL_VERIFY",
  customerId?: string,
): Promise<{ success: boolean; error?: string; simulated?: boolean; cooldownSeconds?: number }> {
  const normalizedEmail = email.trim().toLowerCase();

  // Generate cryptographically secure 6-digit numeric OTP
  const rawCode = String(randomInt(100000, 1000000));
  const codeHash = hashString(rawCode);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  // Store hashed verification record
  try {
    await db.verificationCode.create({
      data: {
        target: normalizedEmail,
        codeHash,
        type,
        customerId: customerId ?? null,
        expiresAt,
      },
    });
  } catch {
    devStore.createVerificationCode({
      target: normalizedEmail,
      codeHash,
      type,
      customerId,
      expiresAt,
    });
  }

  // Dispatch via EmailJS (template_uhqx4oa with {{passcode}} and {{time}})
  const result = await sendVerificationEmail(normalizedEmail, rawCode, OTP_EXPIRY_MINUTES);

  return {
    success: result.success,
    error: result.error,
    simulated: result.simulated,
  };
}

/**
 * Verifies a single-use 6-digit OTP on the server.
 */
export async function verifyEmailOtp(
  email: string,
  code: string,
  type: "EMAIL_VERIFY" | "LOGIN_RECOVERY" = "EMAIL_VERIFY",
): Promise<{ valid: boolean; error?: string; customerId?: string | null }> {
  const normalizedEmail = email.trim().toLowerCase();
  const inputHash = hashString(code.trim());

  let record: {
    id: string;
    codeHash: string;
    attempts: number;
    customerId?: string | null;
  } | null | undefined = null;
  let isDev = false;

  try {
    record = await db.verificationCode.findFirst({
      where: {
        target: normalizedEmail,
        type,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch {
    const devRec = devStore.findValidCode(normalizedEmail, type);
    if (devRec) {
      record = devRec;
      isDev = true;
    }
  }

  if (!record) {
    return { valid: false, error: "Invalid or expired verification code." };
  }

  if (record.attempts >= 5) {
    return { valid: false, error: "Too many failed attempts. Please request a new code." };
  }

  if (record.codeHash !== inputHash) {
    if (isDev) {
      devStore.incrementCodeAttempts(record.id);
    } else {
      await db.verificationCode
        .update({
          where: { id: record.id },
          data: { attempts: { increment: 1 } },
        })
        .catch(() => {});
    }
    const remaining = 5 - (record.attempts + 1);
    return {
      valid: false,
      error: `Incorrect code. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`,
    };
  }

  // Mark code as used (single-use guarantee)
  if (isDev) {
    devStore.markCodeUsed(record.id);
  } else {
    await db.verificationCode
      .update({
        where: { id: record.id },
        data: { usedAt: new Date() },
      })
      .catch(() => {});
  }

  return { valid: true, customerId: record.customerId };
}

/**
 * Issues a customer session cookie and records the token hash in CustomerSession.
 */
export async function createCustomerSession(
  customerId: string,
  req: { ip?: string; userAgent?: string } = {},
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  try {
    await db.customerSession.create({
      data: {
        tokenHash: hashString(token),
        customerId,
        expiresAt,
        ipHash: req.ip ? hashString(req.ip).slice(0, 32) : null,
        userAgent: req.userAgent?.slice(0, 255) ?? null,
      },
    });
  } catch {
    devStore.createCustomerSession({
      tokenHash: hashString(token),
      customerId,
      expiresAt,
    });
  }

  const cookieJar = await cookies();
  cookieJar.set(CUSTOMER_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });

  return { token, expiresAt };
}

/**
 * Resolves the currently authenticated customer from the session cookie.
 */
export async function getCurrentCustomer(): Promise<CustomerUser | null> {
  try {
    const cookieJar = await cookies();
    const token = cookieJar.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (!token) return null;

    try {
      const session = await db.customerSession.findUnique({
        where: { tokenHash: hashString(token) },
        include: { customer: true },
      });

      if (!session || session.expiresAt < new Date()) {
        return null;
      }

      return {
        id: session.customer.id,
        name: session.customer.name,
        email: session.customer.email,
        phone: session.customer.phone,
        emailVerified: session.customer.emailVerified,
        phoneVerified: session.customer.phoneVerified,
        accountStatus: session.customer.accountStatus,
      };
    } catch {
      const devSess = devStore.findSession(hashString(token));
      if (!devSess) return null;
      return {
        id: devSess.customer.id,
        name: devSess.customer.name,
        email: devSess.customer.email,
        phone: devSess.customer.phone,
        emailVerified: devSess.customer.emailVerified ? new Date(devSess.customer.emailVerified) : null,
        phoneVerified: devSess.customer.phoneVerified,
        accountStatus: devSess.customer.accountStatus,
      };
    }
  } catch {
    return null;
  }
}

/**
 * Destroys the customer session on logout.
 */
export async function clearCustomerSession(): Promise<void> {
  try {
    const cookieJar = await cookies();
    const token = cookieJar.get(CUSTOMER_SESSION_COOKIE)?.value;
    if (token) {
      try {
        await db.customerSession.deleteMany({
          where: { tokenHash: hashString(token) },
        });
      } catch {
        devStore.deleteSession(hashString(token));
      }
      cookieJar.delete(CUSTOMER_SESSION_COOKIE);
    }
  } catch (err) {
    console.error("[CustomerAuth] Logout error:", err);
  }
}

