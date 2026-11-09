import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { db } from "@/lib/db";
import { devStore } from "@/lib/auth/dev-store";

export async function GET() {
  const customerUser = await getCurrentCustomer();
  if (!customerUser) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  let customer: any = null;
  try {
    customer = await db.customer.findUnique({
      where: { id: customerUser.id },
      include: {
        addresses: { orderBy: { isDefault: "desc" } },
        passkeys: {
          select: {
            id: true,
            deviceName: true,
            deviceType: true,
            backedUp: true,
            lastUsedAt: true,
            createdAt: true,
          },
          orderBy: { createdAt: "desc" },
        },
        orders: {
          include: {
            items: true,
            payments: true,
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });
  } catch {
    const devC = devStore.findCustomerById(customerUser.id);
    if (devC) {
      const addresses = devStore.findAddressesByCustomerId(customerUser.id);
      const passkeys = devStore.findPasskeysByCustomerId(customerUser.id);
      customer = {
        ...devC,
        addresses,
        passkeys,
        orders: [],
      };
    }
  }

  if (!customer) {
    return NextResponse.json({ authenticated: false }, { status: 404 });
  }

  return NextResponse.json({
    authenticated: true,
    customer: {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company: customer.company || null,
      gstin: customer.gstin || null,
      emailVerified: customer.emailVerified,
      phoneVerified: customer.phoneVerified,
      accountStatus: customer.accountStatus,
      addresses: customer.addresses || [],
      passkeys: customer.passkeys || [],
      orders: customer.orders || [],
    },
  });
}

