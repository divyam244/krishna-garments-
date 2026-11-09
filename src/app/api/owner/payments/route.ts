import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner } from "@/lib/auth/session";

/** Outstanding balances and payment history for the payments desk. */
export async function GET() {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const [orders, payments] = await Promise.all([
      db.order.findMany({
        where: { paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, status: { not: "CANCELLED" } },
        orderBy: { dueDate: { sort: "asc", nulls: "last" } },
        take: 300,
        select: { id: true, orderNo: true, customerName: true, total: true, paidAmount: true, dueDate: true, paymentStatus: true, createdAt: true, isSample: true },
      }),
      db.payment.findMany({ orderBy: { recordedAt: "desc" }, take: 120 }),
    ]);

    return NextResponse.json({
      receivables: orders.map((o) => ({
        orderId: o.id,
        orderNo: o.orderNo,
        customer: o.customerName,
        total: Number(o.total),
        paid: Number(o.paidAmount),
        balance: Math.max(0, Number(o.total) - Number(o.paidAmount)),
        dueDate: o.dueDate?.toISOString() ?? null,
        paymentStatus: o.paymentStatus,
        placedAt: o.createdAt.toISOString(),
        isSample: o.isSample,
      })),
      receipts: payments.map((p) => ({
        id: p.id,
        receiptNo: p.receiptNo,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        recordedAt: p.recordedAt.toISOString(),
        isSample: p.isSample,
      })),
    });
  } catch (e) {
    console.warn("[owner/payments] list failed:", (e as Error).message);
    return NextResponse.json({ receivables: [], receipts: [] });
  }
}

const Schema = z.object({
  orderId: z.string().min(1),
  amount: z.coerce.number().min(0, "Amount must be positive"),
  method: z.enum(["BANK", "UPI", "CASH", "CARD"]).default("BANK"),
});

/** Records a payment against an order and recalculates the order's payment state. */
export const POST = ownerRoute(Schema, async (d, _req, owner) => {
  const order = await db.order.findUnique({ where: { id: d.orderId } });
  if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

  const total = Number(order.total);
  const paid = Number(order.paidAmount) + d.amount;

  if (paid > total + 0.01) {
    return NextResponse.json({ error: `That exceeds the outstanding balance of ${total - Number(order.paidAmount)}.` }, { status: 422 });
  }

  const status = paid >= total ? "PAID" : paid > 0 ? "PARTIAL" : "UNPAID";

  const [payment] = await db.$transaction([
    db.payment.create({
      data: {
        receiptNo: `RC-${String(Date.now()).slice(-6)}`,
        orderId: order.id,
        customerId: order.customerId,
        amount: d.amount,
        method: d.method,
        status,
        isSample: false,
      },
    }),
    db.order.update({
      where: { id: order.id },
      data: { paidAmount: paid, paymentStatus: status as never },
    }),
  ]);

  await audit(owner.id, "payment.record", "Payment", payment.id);
  return NextResponse.json({ ok: true, receiptNo: payment.receiptNo, paid, status });
});
