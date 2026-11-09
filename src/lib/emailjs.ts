/**
 * EmailJS Server-side Delivery Module for KRISHNA GARMENTS
 *
 * Configured with template_uhqx4oa and exact template variables:
 * - {{passcode}} : 6-digit verification OTP
 * - {{time}}     : Timestamp / expiry string (e.g. "15 minutes (02:45 PM)")
 *
 * Uses the EmailJS REST API: https://api.emailjs.com/api/v1.0/email/send
 * Private credentials are never exposed to the frontend.
 */

export const EMAILJS_CONFIG = {
  templateId: process.env.EMAILJS_TEMPLATE_ID || "template_uhqx4oa",
  serviceId: process.env.EMAILJS_SERVICE_ID || "service_68s86h7",
  publicKey: process.env.EMAILJS_PUBLIC_KEY || "KumCQz5ptENwOhrq1",
  privateKey: process.env.EMAILJS_PRIVATE_KEY || "3r5NDJzR1I9bsZpsQneSv",
  logoUrl: "https://res.cloudinary.com/v86wzzbs/image/upload/f_png,q_auto/Krishna_Garments_Gold_Logo",
};

export type SendOtpResult = {
  success: boolean;
  messageId?: string;
  error?: string;
  simulated?: boolean;
};

/**
 * Sends a verification OTP code via EmailJS using template_uhqx4oa.
 *
 * @param toEmail The customer's registered email address
 * @param passcode The 6-digit verification code (e.g. "492817")
 * @param expiryMinutes Validity window in minutes (default 15)
 */
export async function sendVerificationEmail(
  toEmail: string,
  passcode: string,
  expiryMinutes: number = 15,
): Promise<SendOtpResult> {
  const serviceId = EMAILJS_CONFIG.serviceId.trim();
  const publicKey = EMAILJS_CONFIG.publicKey.trim();
  const templateId = EMAILJS_CONFIG.templateId.trim();
  const privateKey = EMAILJS_CONFIG.privateKey.trim();

  const formattedTime = new Date().toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const timeString = `${expiryMinutes} mins (sent at ${formattedTime})`;

  // If EmailJS credentials are not yet configured in .env, log cleanly for dev
  if (!serviceId || !publicKey) {
    console.warn(
      `[EmailJS] Missing EMAILJS_SERVICE_ID or EMAILJS_PUBLIC_KEY in environment.\n` +
      `[DEV AUTH OTP for ${toEmail}]: Passcode = ${passcode} (valid for ${expiryMinutes}m)\n` +
      `Configure EMAILJS_SERVICE_ID and EMAILJS_PUBLIC_KEY in .env to deliver real emails.`
    );
    return {
      success: true,
      simulated: true,
      error: "EmailJS credentials not yet configured in .env. Code logged to server console for testing.",
    };
  }

  try {
    const payload: Record<string, unknown> = {
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      template_params: {
        to_email: toEmail,
        email: toEmail,
        to: toEmail,
        recipient: toEmail,
        user_email: toEmail,
        reply_to: toEmail,
        to_name: toEmail.split("@")[0],
        passcode: passcode,
        time: timeString,
        app_name: "KRISHNA GARMENTS",
        logo_url: EMAILJS_CONFIG.logoUrl,
      },
    };

    if (privateKey) {
      payload.accessToken = privateKey;
    }

    const siteOrigin = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

    console.log(`\n📧 [EmailJS Dispatch] Sending OTP to: ${toEmail}`);
    console.log(`🔑 [OTP Passcode]: ${passcode} (valid for ${expiryMinutes}m)\n`);

    const res = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "KrishnaGarments-Auth/2.0",
        "Origin": siteOrigin,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`[EmailJS] Delivery failed (${res.status}): ${errText}`);

      if (errText.includes("non-browser")) {
        console.warn(
          `\n⚠️ [EmailJS Action Required]: Enable "Allow EmailJS API for non-browser applications" at:\n` +
          `👉 https://dashboard.emailjs.com/admin/account/security\n` +
          `[DEV PASSCODE for ${toEmail}]: ${passcode}\n`
        );
      }

      return {
        success: false,
        error: errText.includes("non-browser")
          ? "Please enable 'Allow EmailJS API for non-browser applications' in EmailJS Account Security."
          : `EmailJS error (${res.status}): ${errText || "Unable to deliver email"}`,
      };
    }

    return {
      success: true,
      messageId: `emailjs-${Date.now()}`,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[EmailJS] Exception sending email to ${toEmail}:`, msg);
    return {
      success: false,
      error: `Network error connecting to email service: ${msg}`,
    };
  }
}

