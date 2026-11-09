import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";

const Schema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(-99999).max(99999).refine((n) => n !== 0, "Enter a quantity"),
  reason: z.string().trim().max(200).optional().or(z.literal("")),
});

/** Stock adjustments are ledgered, never silently overwritten. */
export const POST = ownerRoute(Schema, async (d, _req, owner) => {
  const product = await db.product.findUnique({ where: { id: d.productId } });
  if (!product) return NextResponse.json({ error: "Product not found." }, { status: 404 });

  const nextStock = Math.max(0, product.stockOnHand + d.quantity);

  const [, updated] = await db.$transaction([
    db.stockMovement.create({
      data: {
        productId: d.productId,
        type: d.quantity > 0 ? "IN" : "OUT",
        quantity: d.quantity,
        reason: d.reason || null,
      },
    }),
    db.product.update({
      where: { id: d.productId },
      data: {
        stockOnHand: nextStock,
        availability: nextStock === 0 ? "OUT_OF_STOCK" : nextStock <= 15 ? "LOW_STOCK" : "IN_STOCK",
      },
    }),
  ]);

  await audit(owner.id, "stock.adjust", "Product", d.productId);
  return NextResponse.json({ ok: true, stockOnHand: updated.stockOnHand, availability: updated.availability });
});
