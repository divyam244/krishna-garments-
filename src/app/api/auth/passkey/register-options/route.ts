import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { getPasskeyRegistrationOptions } from "@/lib/auth/webauthn";
import { db } from "@/lib/db";
import { devStore } from "@/lib/auth/dev-store";

export async function POST(req: Request) {
  try {
    let customer: any = await getCurrentCustomer();

    // If not authenticated via cookie yet (e.g. right after email OTP step in modal)
    if (!customer) {
      const body = await req.json().catch(() => ({}));
      if (body.customerId) {
        let found: any = null;
        try {
          found = await db.customer.findUnique({ where: { id: body.customerId } });
        } catch {
          found = devStore.findCustomerById(body.customerId);
        }
        if (found && found.emailVerified) {
          customer = found;
        }
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "Authentication required to register a passkey." }, { status: 401 });
    }

    const options = await getPasskeyRegistrationOptions(customer);
    return NextResponse.json(options);
  } catch (err) {
    console.error("[Passkey Register Options API] Error:", err);
    return NextResponse.json({ error: "Failed to generate passkey registration options." }, { status: 500 });
  }
}

