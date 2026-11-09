import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner } from "@/lib/auth/session";

/** Production batches for the production manager. */
export async function GET() {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const rows = await db.productionBatch.findMany({ orderBy: { updatedAt: "desc" }, take: 300 });
    return NextResponse.json(
      rows.map((b) => ({
        id: b.id,
        batchNo: b.batchNo,
        productName: b.productName,
        stage: b.stage,
        progressPct: b.progressPct,
        completedQty: b.completedQty,
        targetQty: b.targetQty,
        inCharge: b.inCharge ?? "",
        startDate: b.startDate.toISOString(),
        expectedDate: b.expectedDate?.toISOString() ?? null,
        notes: b.notes ?? "",
        isSample: b.isSample,
      })),
    );
  } catch (e) {
    console.warn("[owner/batches] list failed:", (e as Error).message);
    return NextResponse.json([]);
  }
}

const Create = z.object({
  productName: z.string().trim().min(2, "Name the style being produced").max(160),
  targetQty: z.coerce.number().int().min(1, "Target must be at least 1"),
  inCharge: z.string().trim().max(120).optional().or(z.literal("")),
  expectedDate: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const POST = ownerRoute(Create, async (d, _req, owner) => {
  const batch = await db.productionBatch.create({
    data: {
      batchNo: `KG-${String(Date.now()).slice(-5)}`,
      productName: d.productName,
      targetQty: d.targetQty,
      completedQty: 0,
      stage: "CUTTING",
      progressPct: 0,
      startDate: new Date(),
      expectedDate: d.expectedDate ? new Date(d.expectedDate) : null,
      inCharge: d.inCharge || null,
      notes: d.notes || null,
      isSample: false,
    },
  });
  await audit(owner.id, "batch.create", "ProductionBatch", batch.id);
  return NextResponse.json({ ok: true, id: batch.id, batchNo: batch.batchNo });
});
