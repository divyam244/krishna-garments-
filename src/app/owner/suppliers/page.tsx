import { db } from "@/lib/db";
import SuppliersManager, { type SupplierRow } from "@/components/owner/managers/SuppliersManager";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

export default async function SuppliersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const { new: newFlag } = await searchParams;
  const canCreate = newFlag === "1";

  let rows: SupplierRow[] = [];
  try {
    const all = await db.supplier.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { purchases: true } } } });
    rows = all.map((s) => ({
      id: s.id, name: s.name, contactName: s.contactName ?? "", phone: s.phone ?? "",
      email: s.email ?? "", supplies: s.supplies ?? "", leadTimeDays: s.leadTimeDays ?? 0,
      outstanding: s.outstanding == null ? 0 : Number(s.outstanding),
      notes: s.notes ?? "", purchaseCount: s._count.purchases, isSample: s.isSample,
    }));
  } catch (e) {
    console.warn("[owner/suppliers page] list failed:", (e as Error).message);
  }

  return (
    <>
      <SuppliersManager initial={rows} />
      {canCreate && <QuickActions openNew="suppliers" />}
    </>
  );
}