import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner } from "@/lib/auth/session";

/** Customers list for the owner CRM table. */
export async function GET() {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const rows = await db.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } }, orders: { select: { total: true, paidAmount: true } } },
    });
    return NextResponse.json(
      rows.map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company ?? "",
        phone: c.phone ?? "",
        email: c.email ?? "",
        city: c.city ?? "",
        gstin: c.gstin ?? "",
        type: c.type,
        notes: c.notes ?? "",
        orderCount: c._count.orders,
        lifetimeValue: c.orders.reduce((s, o) => s + Number(o.total), 0),
        outstanding: c.orders.reduce((s, o) => s + Math.max(0, Number(o.total) - Number(o.paidAmount)), 0),
        isSample: c.isSample,
        createdAt: c.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    console.warn("[owner/customers] list failed:", (e as Error).message);
    return NextResponse.json([]);
  }
}

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required").max(160),
  company: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  gstin: z.string().trim().max(30).optional().or(z.literal("")),
  type: z.enum(["RETAIL", "WHOLESALE", "BULK"]).default("RETAIL"),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const POST = ownerRoute(Schema, async (d, _req, owner) => {
  if (d.id) {
    const updated = await db.customer.update({
      where: { id: d.id },
      data: {
        name: d.name,
        company: d.company || null,
        phone: d.phone || null,
        email: d.email || null,
        city: d.city || null,
        gstin: d.gstin || null,
        type: d.type,
        notes: d.notes || null,
      },
    });
    await audit(owner.id, "customer.update", "Customer", updated.id);
    return NextResponse.json({ ok: true, id: updated.id });
  }

  const created = await db.customer.create({
    data: {
      name: d.name,
      company: d.company || null,
      phone: d.phone || null,
      email: d.email || null,
      city: d.city || null,
      gstin: d.gstin || null,
      type: d.type,
      notes: d.notes || null,
      isSample: false,
    },
  });
  await audit(owner.id, "customer.create", "Customer", created.id);
  return NextResponse.json({ ok: true, id: created.id });
});
