import { NextResponse } from "next/server";
import { getCurrentCustomer } from "@/lib/auth/customer";
import { db } from "@/lib/db";
import { devStore } from "@/lib/auth/dev-store";

export async function POST(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { label, fullName, phone, street, city, state, pincode, isDefault } = await req.json();

  if (!street || !city || !pincode) {
    return NextResponse.json({ error: "Street, city and pincode are required." }, { status: 400 });
  }

  let addr: any = null;
  try {
    if (isDefault) {
      await db.customerAddress.updateMany({
        where: { customerId: customer.id },
        data: { isDefault: false },
      });
    }

    addr = await db.customerAddress.create({
      data: {
        customerId: customer.id,
        label: label?.trim() || "Home",
        fullName: fullName?.trim() || customer.name,
        phone: phone?.trim() || customer.phone || "",
        street: street.trim(),
        city: city.trim(),
        state: state?.trim() || "Delhi",
        pincode: pincode.trim(),
        isDefault: Boolean(isDefault),
      },
    });
  } catch {
    addr = devStore.createAddress({
      customerId: customer.id,
      street: street.trim(),
      city: city.trim(),
      state: state?.trim() || "Delhi",
      pincode: pincode.trim(),
      isDefault: Boolean(isDefault),
    });
  }

  return NextResponse.json({ ok: true, address: addr });
}

export async function DELETE(req: Request) {
  const customer = await getCurrentCustomer();
  if (!customer) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Address ID required" }, { status: 400 });
  }

  try {
    await db.customerAddress.deleteMany({
      where: { id, customerId: customer.id },
    });
  } catch {
    devStore.deleteAddress(id, customer.id);
  }

  return NextResponse.json({ ok: true });
}

