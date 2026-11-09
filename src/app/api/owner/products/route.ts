import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner, UnauthorizedError } from "@/lib/auth/session";

/** Products + stock for the inventory manager. */
export async function GET() {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const rows = await db.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { slug: true, name: true } } },
    });

    return NextResponse.json(
      rows.map((p) => ({
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category.name,
        categoryId: p.categoryId,
        categorySlug: p.category.slug,
        price: p.price == null ? null : Number(p.price),
        mrp: p.mrp == null ? null : Number(p.mrp),
        stockOnHand: p.stockOnHand,
        minOrderQty: p.minOrderQty,
        availability: p.availability,
        sizes: Array.isArray(p.sizes) ? p.sizes : [],
        colours: Array.isArray(p.colours) ? p.colours : [],
        fabric: p.fabric ?? "",
        description: p.description,
        isNewArrival: p.isNewArrival,
        onSale: p.onSale,
        priceOnRequest: p.priceOnRequest,
        image: Array.isArray(p.images) && typeof p.images[0] === "string" ? p.images[0] : "",
        active: p.active,
        isSample: p.isSample,
        updatedAt: p.updatedAt.toISOString(),
      })),
    );
  } catch (e) {
    console.warn("[owner/products] list failed:", (e as Error).message);
    return NextResponse.json([]);
  }
}
import { slugify } from "@/lib/format";

const Schema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Product name is required").max(160),
  categoryId: z.string().min(1, "Choose a category"),
  description: z.string().trim().min(10, "Add a short description").max(4000),
  fabric: z.string().trim().max(200).optional().or(z.literal("")),
  price: z.coerce.number().min(0).nullable().optional(),
  mrp: z.coerce.number().min(0).nullable().optional(),
  sizes: z.array(z.string().trim().min(1).max(12)).default(["S", "M", "L"]),
  colours: z.array(z.object({ name: z.string().trim().min(1).max(40), hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/) })).default([]),
  stockOnHand: z.coerce.number().int().min(0).default(0),
  minOrderQty: z.coerce.number().int().min(1).default(1),
  availability: z.enum(["IN_STOCK", "LOW_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"]).default("IN_STOCK"),
  isNewArrival: z.boolean().default(false),
  onSale: z.boolean().default(false),
  priceOnRequest: z.boolean().default(false),
  image: z.string().max(600).optional().or(z.literal("")),
});

export const POST = ownerRoute(Schema, async (d, _req, owner) => {
  const baseSlug = slugify(d.name);
  let slug = baseSlug;
  // Avoid a unique-constraint crash when two styles share a name.
  for (let n = 2; await db.product.findUnique({ where: { slug } }); n++) slug = `${baseSlug}-${n}`;

  const sku = `KG-${String(Date.now()).slice(-6)}`;

  const product = await db.product.create({
    data: {
      sku,
      slug,
      name: d.name,
      description: d.description,
      categoryId: d.categoryId,
      fabric: d.fabric || null,
      price: d.price ?? null,
      mrp: d.mrp ?? null,
      sizes: d.sizes,
      colours: d.colours,
      stockOnHand: d.stockOnHand,
      minOrderQty: d.minOrderQty,
      availability: d.availability,
      isNewArrival: d.isNewArrival,
      onSale: d.onSale,
      priceOnRequest: d.priceOnRequest,
      images: d.image ? [d.image] : [],
      isSample: false, // owner-created records are real business data
    },
  });

  await audit(owner.id, "product.create", "Product", product.id);
  return NextResponse.json({ ok: true, id: product.id, slug: product.slug });
});

export const PATCH = ownerRoute(Schema.extend({ id: z.string().min(1) }), async (d, _req, owner) => {
  const { id, ...rest } = d;
  const product = await db.product.update({
    where: { id },
    data: {
      name: rest.name,
      description: rest.description,
      categoryId: rest.categoryId,
      fabric: rest.fabric || null,
      price: rest.price ?? null,
      mrp: rest.mrp ?? null,
      sizes: rest.sizes,
      colours: rest.colours,
      stockOnHand: rest.stockOnHand,
      minOrderQty: rest.minOrderQty,
      availability: rest.availability,
      isNewArrival: rest.isNewArrival,
      onSale: rest.onSale,
      priceOnRequest: rest.priceOnRequest,
      ...(rest.image ? { images: [rest.image] } : {}),
    },
  });

  await audit(owner.id, "product.update", "Product", product.id);
  return NextResponse.json({ ok: true, id: product.id });
});
