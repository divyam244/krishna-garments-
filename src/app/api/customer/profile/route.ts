import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { db } from "@/lib/db";
import { devStore } from "@/lib/auth/dev-store";

export async function PUT(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { name, company, gstin } = await req.json();

  if (!name || typeof name !== "string" || name.trim().length < 2) {
    return NextResponse.json({ error: "Name must be at least 2 characters." }, { status: 400 });
  }

  let updated: any = null;
  try {
    updated = await db.customer.update({
      where: { id: customer.id },
      data: {
        name: name.trim(),
        company: company?.trim() || null,
        gstin: gstin?.trim() || null,
      },
    });
  } catch {
    updated = devStore.upsertCustomer({
      id: customer.id,
      name: name.trim(),
      email: customer.email || "",
      phone: customer.phone || "",
    });
  }

  return NextResponse.json({ ok: true, customer: updated });
}

