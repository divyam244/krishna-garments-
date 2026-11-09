import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { db } from "@/lib/db";
import { devStore } from "@/lib/auth/dev-store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const deleted = await db.passkey.deleteMany({
      where: { id, customerId: customer.id },
    });

    if (deleted.count === 0) {
      return NextResponse.json({ error: "Passkey not found" }, { status: 404 });
    }
  } catch {
    devStore.deletePasskey(id, customer.id);
  }

  return NextResponse.json({ ok: true, message: "Device removed." });
}

