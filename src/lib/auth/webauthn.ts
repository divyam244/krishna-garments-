import "server-only";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
  type VerifiedRegistrationResponse,
  type VerifiedAuthenticationResponse,
} from "@simplewebauthn/server";
import { db } from "@/lib/db";
import { headers } from "next/headers";
import { devStore } from "@/lib/auth/dev-store";

const RP_NAME = "KRISHNA GARMENTS";
const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getWebAuthnConfig() {
  const reqHeaders = await headers();
  const host = reqHeaders.get("host") || "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const origin = `${protocol}://${host}`;
  const rpID = host.split(":")[0];

  return { rpID, origin, rpName: RP_NAME };
}

/**
 * Generates registration options for a verified customer.
 */
export async function getPasskeyRegistrationOptions(customer: {
  id: string;
  name: string;
  email: string | null;
}) {
  const { rpID, rpName } = await getWebAuthnConfig();

  // Find existing passkeys for this customer to prevent re-registration
  let existing: { credentialId: string; transports?: string | null }[] = [];
  try {
    existing = await db.passkey.findMany({
      where: { customerId: customer.id },
    });
  } catch {
    existing = devStore.findPasskeysByCustomerId(customer.id);
  }

  const options = await generateRegistrationOptions({
    rpName,
    rpID,
    userID: new TextEncoder().encode(customer.id),
    userName: customer.email || customer.name,
    userDisplayName: customer.name,
    attestationType: "none",
    excludeCredentials: existing.map((p) => ({
      id: p.credentialId,
      transports: p.transports ? (p.transports.split(",") as any) : undefined,
    })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
    },
  });

  // Store challenge in database or dev store
  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  try {
    await db.webAuthnChallenge.upsert({
      where: { challenge: options.challenge },
      create: {
        challenge: options.challenge,
        target: customer.id,
        type: "REGISTRATION",
        expiresAt,
      },
      update: {
        target: customer.id,
        type: "REGISTRATION",
        expiresAt,
      },
    });
  } catch {
    devStore.saveChallenge(options.challenge, customer.id, "REGISTRATION", expiresAt);
  }

  return options;
}

/**
 * Verifies the WebAuthn registration response and persists the passkey.
 */
export async function verifyPasskeyRegistration(
  customerId: string,
  response: any,
  deviceName: string = "Biometric Passkey",
): Promise<{ verified: boolean; error?: string }> {
  const { rpID, origin } = await getWebAuthnConfig();

  // Find the stored registration challenge for this customer
  let challengeStr: string | null = null;
  let isDev = false;
  try {
    const challengeRecord = await db.webAuthnChallenge.findFirst({
      where: {
        target: customerId,
        type: "REGISTRATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    challengeStr = challengeRecord?.challenge ?? null;
  } catch {
    isDev = true;
    const devCh = devStore.getChallenge(response?.response?.clientDataJSON ? JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString()).challenge : "");
    challengeStr = devCh?.challenge ?? null;
  }

  if (!challengeStr) {
    // If not matched by exact clientDataJSON, find any active challenge for target
    const store = (await import("@/lib/auth/dev-store")).devStore;
    const devCh = store.findCustomerById(customerId);
    challengeStr = response?.challenge || challengeStr;
  }

  try {
    const verification: VerifiedRegistrationResponse = await verifyRegistrationResponse({
      response,
      expectedChallenge: challengeStr || "",
      expectedOrigin: origin,
      expectedRPID: rpID,
      requireUserVerification: false,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo;

      const publicKeyBase64 = Buffer.from(credential.publicKey).toString("base64");
      const credentialId = credential.id;

      try {
        await db.passkey.create({
          data: {
            customerId,
            credentialId,
            publicKey: publicKeyBase64,
            counter: BigInt(credential.counter),
            deviceType: credentialDeviceType,
            backedUp: credentialBackedUp,
            transports: response.response?.transports ? response.response.transports.join(",") : null,
            deviceName: deviceName || "Passkey Device",
            lastUsedAt: new Date(),
          },
        });
        if (challengeStr) {
          await db.webAuthnChallenge.deleteMany({
            where: { challenge: challengeStr },
          }).catch(() => {});
        }
      } catch {
        devStore.createPasskey({
          customerId,
          credentialId,
          publicKey: publicKeyBase64,
          counter: credential.counter,
          transports: response.response?.transports ? response.response.transports.join(",") : undefined,
          deviceType: credentialDeviceType,
          deviceName,
        });
        if (challengeStr) devStore.deleteChallenge(challengeStr);
      }

      return { verified: true };
    }

    return { verified: false, error: "Passkey verification was rejected by the authenticator." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WebAuthn] Registration error:", msg);
    return { verified: false, error: `Verification failed: ${msg}` };
  }
}

/**
 * Generates authentication options for a customer identified by mobile number.
 */
export async function getPasskeyLoginOptions(phone: string) {
  const normalizedPhone = phone.trim().replace(/\s+/g, "").replace(/\D+/g, "");
  const { rpID } = await getWebAuthnConfig();

  let customer: any = null;
  let passkeys: any[] = [];
  try {
    customer = await db.customer.findUnique({
      where: { phone: normalizedPhone },
      include: { passkeys: true },
    });
    if (customer) passkeys = customer.passkeys;
  } catch {
    customer = devStore.findCustomerByPhone(normalizedPhone);
    if (customer) {
      passkeys = devStore.findPasskeysByCustomerId(customer.id);
    }
  }

  if (!customer) {
    return { error: "No account found registered with this mobile number." };
  }

  if (!passkeys || passkeys.length === 0) {
    return {
      error: "No passkeys registered for this account. Please use email verification recovery to log in.",
      hasPasskey: false,
      email: customer.email,
    };
  }

  const options = await generateAuthenticationOptions({
    rpID,
    userVerification: "preferred",
    allowCredentials: passkeys.map((p) => ({
      id: p.credentialId,
      transports: p.transports ? (p.transports.split(",") as any) : undefined,
    })),
  });

  const expiresAt = new Date(Date.now() + CHALLENGE_TTL_MS);
  try {
    await db.webAuthnChallenge.upsert({
      where: { challenge: options.challenge },
      create: {
        challenge: options.challenge,
        target: customer.id,
        type: "AUTHENTICATION",
        expiresAt,
      },
      update: {
        target: customer.id,
        type: "AUTHENTICATION",
        expiresAt,
      },
    });
  } catch {
    devStore.saveChallenge(options.challenge, customer.id, "AUTHENTICATION", expiresAt);
  }

  return { options, customerId: customer.id };
}

/**
 * Verifies the WebAuthn authentication response and returns the customer.
 */
export async function verifyPasskeyLogin(
  customerId: string,
  response: any,
): Promise<{ verified: boolean; customer?: any; error?: string }> {
  const { rpID, origin } = await getWebAuthnConfig();

  let challengeStr: string | null = null;
  try {
    const challengeRecord = await db.webAuthnChallenge.findFirst({
      where: {
        target: customerId,
        type: "AUTHENTICATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });
    challengeStr = challengeRecord?.challenge ?? null;
  } catch {
    const parsed = response?.response?.clientDataJSON
      ? JSON.parse(Buffer.from(response.response.clientDataJSON, "base64url").toString())
      : null;
    challengeStr = parsed?.challenge || null;
  }

  if (!challengeStr) {
    return { verified: false, error: "Authentication challenge expired. Please retry." };
  }

  const credentialId = response.id;
  let passkey: any = null;
  try {
    passkey = await db.passkey.findUnique({
      where: { credentialId },
      include: { customer: true },
    });
  } catch {
    const pk = devStore.findPasskeyByCredentialId(credentialId);
    if (pk) {
      const cust = devStore.findCustomerById(pk.customerId);
      passkey = { ...pk, customer: cust };
    }
  }

  if (!passkey || passkey.customerId !== customerId) {
    return { verified: false, error: "Unrecognized passkey credential." };
  }

  try {
    const publicKeyBytes = new Uint8Array(Buffer.from(passkey.publicKey, "base64"));

    const verification: VerifiedAuthenticationResponse = await verifyAuthenticationResponse({
      response,
      expectedChallenge: challengeStr,
      expectedOrigin: origin,
      expectedRPID: rpID,
      credential: {
        id: passkey.credentialId,
        publicKey: publicKeyBytes,
        counter: Number(passkey.counter),
        transports: passkey.transports ? (passkey.transports.split(",") as any) : undefined,
      },
      requireUserVerification: false,
    });

    if (verification.verified) {
      try {
        await db.passkey.update({
          where: { id: passkey.id },
          data: {
            counter: BigInt(verification.authenticationInfo.newCounter),
            lastUsedAt: new Date(),
          },
        });
        if (challengeStr) {
          await db.webAuthnChallenge.deleteMany({
            where: { challenge: challengeStr },
          }).catch(() => {});
        }
      } catch {
        devStore.updatePasskeyCounter(passkey.id, verification.authenticationInfo.newCounter);
        devStore.deleteChallenge(challengeStr);
      }

      return { verified: true, customer: passkey.customer };
    }

    return { verified: false, error: "Passkey authentication verification failed." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[WebAuthn] Login verification error:", msg);
    return { verified: false, error: `Authentication error: ${msg}` };
  }
}

