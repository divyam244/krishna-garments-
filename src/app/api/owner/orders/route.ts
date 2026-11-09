import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner, UnauthorizedError } from "@/lib/auth/session";

const Create = z.object({
  customerName: z.string().trim().min(2, "Customer name is required").max(160),
  customerId: z.string().trim().optional().or(z.literal("")),
  channel: z.enum(["ONLINE", "WHOLESALE", "CUSTOM"]).default("WHOLESALE"),
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"]).default("PENDING"),
  paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "OVERDUE"]).default("UNPAID"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        label: z.string().trim().min(1).max(160),
        productId: z.string().trim().optional().or(z.literal("")),
        size: z.string().trim().max(24).optional().or(z.literal("")),
        colour: z.string().trim().max(48).optional().or(z.literal("")),
        unitPrice: z.coerce.number().min(0),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1, "Add at least one line item"),
});

/** List orders for the owner table. */
export async function GET(req: Request) {
  let owner;
  try {
    owner = await requireOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    throw e;
  }

  try {
    const rows = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, orderNo: true, customerName: true, status: true, paymentStatus: true,
        channel: true, total: true, paidAmount: true, createdAt: true, isSample: true,
        _count: { select: { items: true } },
      },
    });

    return NextResponse.json(
      rows.map((r) => ({
        id: r.id,
        orderNo: r.orderNo,
        customerName: r.customerName,
        status: r.status,
        paymentStatus: r.paymentStatus,
        channel: r.channel,
        total: Number(r.total),
        paidAmount: Number(r.paidAmount),
        createdAt: r.createdAt.toISOString(),
        itemCount: r._count.items,
        isSample: r.isSample,
      })),
    );
  } catch (e) {
    console.warn("[owner/orders] list failed:", (e as Error).message);
    return NextResponse.json([]);
  }
}

export const POST = ownerRoute(Create, async (d, _req, owner) => {
  // Totals are computed server-side; the client never decides what it owes.
  const subtotal = d.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  const order = await db.order.create({
    data: {
      orderNo: `KG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      customerId: d.customerId || null,
      customerName: d.customerName,
      channel: d.channel,
      status: d.status,
      paymentStatus: d.paymentStatus,
      subtotal,
      total: subtotal,
      notes: d.notes || null,
      items: {
        create: d.items.map((i) => ({
          productId: i.productId || null,
          label: i.label,
          size: i.size || null,
          colour: i.colour || null,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
          lineTotal: i.unitPrice * i.quantity,
        })),
      },
    },
    include: { items: true },
  });

  await audit(owner.id, "order.create", "Order", order.id);
  return NextResponse.json({ ok: true, id: order.id, orderNo: order.orderNo, total: subtotal });
});
