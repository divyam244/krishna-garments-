import { db } from "@/lib/db";
import ProductionManager, { type BatchRow } from "@/components/owner/managers/ProductionManager";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

export default async function ProductionPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const { new: newFlag } = await searchParams;
  const canCreate = newFlag === "1";

  let rows: BatchRow[] = [];
  try {
    const all = await db.productionBatch.findMany({ orderBy: { updatedAt: "desc" }, take: 300 });
    rows = all.map((b) => ({
      id: b.id, batchNo: b.batchNo, productName: b.productName, stage: b.stage,
      progressPct: b.progressPct, completedQty: b.completedQty, targetQty: b.targetQty,
      inCharge: b.inCharge ?? "",
      startDate: b.startDate.toISOString(),
      expectedDate: b.expectedDate?.toISOString() ?? null,
      notes: b.notes ?? "", isSample: b.isSample,
    }));
  } catch (e) {
    console.warn("[owner/production page] list failed:", (e as Error).message);
  }

  return (
    <>
      <ProductionManager initial={rows} />
      {canCreate && <QuickActions openNew="production" />}
    </>
  );
}