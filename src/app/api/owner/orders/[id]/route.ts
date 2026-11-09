import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner, UnauthorizedError } from "@/lib/auth/session";

/** Single order: detail, status advance, cancel. */
export async function GET(req: Request) {
  let owner;
  try {
    owner = await requireOwner();
  } catch (e) {
    if (e instanceof UnauthorizedError) return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    throw e;
  }

  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  try {
    const order = await db.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) return NextResponse.json({ error: "Order not found." }, { status: 404 });

    return NextResponse.json({
      id: order.id,
      orderNo: order.orderNo,
      customerName: order.customerName,
      status: order.status,
      paymentStatus: order.paymentStatus,
      channel: order.channel,
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      discount: Number(order.discount),
      notes: order.notes ?? "",
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      items: order.items.map((i) => ({
        id: i.id,
        label: i.label,
        size: i.size || "",
        colour: i.colour || "",
        unitPrice: Number(i.unitPrice),
        quantity: i.quantity,
        lineTotal: Number(i.lineTotal),
      })),
      isSample: order.isSample,
    });
  } catch (e) {
    console.warn("[owner/orders/[id]] get failed:", (e as Error).message);
    return NextResponse.json({ error: "Could not load the order." }, { status: 500 });
  }
}

const Update = z.object({
  status: z.enum(["PENDING", "CONFIRMED", "IN_PRODUCTION", "PACKED", "SHIPPED", "COMPLETED", "CANCELLED"]),
  paymentStatus: z.enum(["UNPAID", "PARTIAL", "PAID", "OVERDUE"]).optional(),
});

export const PATCH = ownerRoute(Update, async (d, req, owner) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  const order = await db.order.update({
    where: { id },
    data: { status: d.status, ...(d.paymentStatus ? { paymentStatus: d.paymentStatus } : {}) },
  });

  await audit(owner.id, "order.update", "Order", order.id);
  return NextResponse.json({ ok: true, id: order.id, status: order.status });
});

const Cancel = z.object({});

export const DELETE = ownerRoute(Cancel, async (_d, req, owner) => {
  const url = new URL(req.url);
  const id = url.pathname.split("/").pop();
  const order = await db.order.update({
    where: { id },
    data: { status: "CANCELLED" },
  });

  await audit(owner.id, "order.cancel", "Order", order.id);
  return NextResponse.json({ ok: true, id: order.id, status: order.status });
});
