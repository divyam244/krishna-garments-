import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";

export async function GET(req: Request) {
  const owner = await requireOwner().catch(() => null);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(req.url);
    const search = url.searchParams.get("search")?.trim().toLowerCase();
    const status = url.searchParams.get("status")?.trim();

    const where: any = {};
    if (status && status !== "ALL") {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { invoiceNo: { contains: search, mode: "insensitive" } },
        { customerName: { contains: search, mode: "insensitive" } },
        { customerPhone: { contains: search, mode: "insensitive" } },
      ];
    }

    const invoices = await db.invoice.findMany({
      where,
      orderBy: { issuedAt: "desc" },
      include: {
        customer: { select: { id: true, name: true, phone: true, email: true } },
        order: { select: { id: true, orderNo: true } },
      },
      take: 100,
    });

    return NextResponse.json({ ok: true, invoices });
  } catch (err: any) {
    console.error("[Invoices API] Error:", err);
    return NextResponse.json({ ok: true, invoices: [] });
  }
}

export async function POST(req: Request) {
  const owner = await requireOwner().catch(() => null);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      customerId,
      customerName,
      customerPhone,
      customerEmail,
      customerGstin,
      billingAddress,
      orderId,
      items, // array of { label, size, qty, rate, amount }
      taxRatePct = 5,
      discount = 0,
      amountPaid = 0,
      dueDate,
      notes,
    } = body;

    if (!customerName || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Customer name and at least one line item are required." },
        { status: 400 },
      );
    }

    // Calculate subtotal
    const subtotal = items.reduce(
      (sum: number, it: any) => sum + Number(it.qty || 1) * Number(it.rate || 0),
      0,
    );

    const taxAmount = (subtotal * Number(taxRatePct)) / 100;
    const totalAmount = Math.max(0, subtotal + taxAmount - Number(discount));
    const paid = Number(amountPaid);
    const balanceDue = Math.max(0, totalAmount - paid);

    const count = await db.invoice.count();
    const invoiceNo = `KG-INV-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

    const status = balanceDue <= 0 ? "PAID" : paid > 0 ? "PARTIAL" : "ISSUED";

    const invoice = await db.invoice.create({
      data: {
        invoiceNo,
        customerId: customerId || null,
        orderId: orderId || null,
        customerName: customerName.trim(),
        customerPhone: customerPhone?.trim() || null,
        customerEmail: customerEmail?.trim() || null,
        customerGstin: customerGstin?.trim() || null,
        billingAddress: billingAddress?.trim() || null,
        subtotal,
        taxRatePct: Number(taxRatePct),
        taxAmount,
        discount: Number(discount),
        totalAmount,
        amountPaid: paid,
        balanceDue,
        status,
        items,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes?.trim() || null,
      },
    });

    // Record audit log
    await db.auditLog.create({
      data: {
        userId: owner.id,
        action: "INVOICE_CREATE",
        entity: "Invoice",
        entityId: invoice.id,
        detail: `Created invoice ${invoiceNo} for ₹${totalAmount}`,
      },
    });

    return NextResponse.json({ ok: true, invoice });
  } catch (err: any) {
    console.error("[Create Invoice API] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create invoice." }, { status: 500 });
  }
}

