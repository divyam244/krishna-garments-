import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner } from "@/lib/auth/session";

/** Suppliers list for the owner table. */
export async function GET() {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const rows = await db.supplier.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { purchases: true } } },
    });
    return NextResponse.json(
      rows.map((s) => ({
        id: s.id,
        name: s.name,
        contactName: s.contactName ?? "",
        phone: s.phone ?? "",
        email: s.email ?? "",
        supplies: s.supplies ?? "",
        leadTimeDays: s.leadTimeDays ?? 0,
        outstanding: s.outstanding == null ? 0 : Number(s.outstanding),
        notes: s.notes ?? "",
        purchaseCount: s._count.purchases,
        isSample: s.isSample,
      })),
    );
  } catch (e) {
    console.warn("[owner/suppliers] list failed:", (e as Error).message);
    return NextResponse.json([]);
  }
}

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Supplier name is required").max(160),
  contactName: z.string().trim().max(120).optional().or(z.literal("")),
  phone: z.string().trim().max(24).optional().or(z.literal("")),
  email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
  supplies: z.string().trim().max(160).optional().or(z.literal("")),
  leadTimeDays: z.coerce.number().int().min(0).max(3650).optional(),
  outstanding: z.coerce.number().min(0).optional(),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const POST = ownerRoute(Schema, async (d, _req, owner) => {
  const data = {
    name: d.name,
    contactName: d.contactName || null,
    phone: d.phone || null,
    email: d.email || null,
    supplies: d.supplies || null,
    leadTimeDays: d.leadTimeDays,
    outstanding: d.outstanding,
    notes: d.notes || null,
  };

  if (d.id) {
    const updated = await db.supplier.update({ where: { id: d.id }, data });
    await audit(owner.id, "supplier.update", "Supplier", updated.id);
    return NextResponse.json({ ok: true, id: updated.id });
  }

  const created = await db.supplier.create({ data: { ...data, isSample: false } });
  await audit(owner.id, "supplier.create", "Supplier", created.id);
  return NextResponse.json({ ok: true, id: created.id });
});
