import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await requireOwner().catch(() => null);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const invoice = await db.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        order: { include: { items: true } },
        payments: true,
      },
    });

    if (!invoice) {
      return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, invoice });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const owner = await requireOwner().catch(() => null);
  if (!owner) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  try {
    const existing = await db.invoice.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Invoice not found" }, { status: 404 });

    const total = Number(existing.totalAmount);
    let amountPaid = Number(existing.amountPaid);

    if (body.addPayment) {
      const added = Number(body.addPayment);
      amountPaid += added;

      // Also record payment row
      await db.payment.create({
        data: {
          receiptNo: `REC-${Date.now().toString().slice(-6)}`,
          invoiceId: id,
          orderId: existing.orderId,
          customerId: existing.customerId,
          amount: added,
          method: body.paymentMethod || "UPI",
          status: amountPaid >= total ? "PAID" : "PARTIAL",
        },
      });
    }

    const balanceDue = Math.max(0, total - amountPaid);
    const status = balanceDue <= 0 ? "PAID" : amountPaid > 0 ? "PARTIAL" : existing.status;

    const updated = await db.invoice.update({
      where: { id },
      data: {
        amountPaid,
        balanceDue,
        status: body.status || status,
        notes: body.notes !== undefined ? body.notes : existing.notes,
      },
    });

    return NextResponse.json({ ok: true, invoice: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

