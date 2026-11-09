import { db } from "@/lib/db";
import InventoryManager, { type ProductRow } from "@/components/owner/managers/InventoryManager";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const { new: newFlag } = await searchParams;
  const canCreate = newFlag === "1";

  const categories = await db.category.findMany({
    where: { showInNav: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  let rows: ProductRow[] = [];
  try {
    const all = await db.product.findMany({
      orderBy: { updatedAt: "desc" },
      include: { category: { select: { slug: true, name: true } } },
    });
    rows = all.map((p) => ({
      id: p.id, sku: p.sku, name: p.name, category: p.category.name, categoryId: p.categoryId,
      price: p.price == null ? null : Number(p.price),
      mrp: p.mrp == null ? null : Number(p.mrp),
      stockOnHand: p.stockOnHand, minOrderQty: p.minOrderQty,
      availability: p.availability,
      sizes: Array.isArray(p.sizes) ? (p.sizes as string[]) : [],
      colours: Array.isArray(p.colours) ? (p.colours as { name: string; hex: string }[]) : [],
      fabric: p.fabric ?? "", description: p.description,
      isNewArrival: p.isNewArrival, onSale: p.onSale, priceOnRequest: p.priceOnRequest,
      image: Array.isArray(p.images) && p.images[0] !== undefined ? p.images[0] as string : "",
      isSample: p.isSample,
    }));
  } catch (e) {
    console.warn("[owner/inventory page] list failed:", (e as Error).message);
  }

  return (
    <>
      <InventoryManager initial={rows} categories={categories} />
      {canCreate && <QuickActions openNew="inventory" />}
    </>
  );
}