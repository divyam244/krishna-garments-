import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";

const STAGES = ["CUTTING", "STITCHING", "FINISHING", "QUALITY_CHECK", "PACKAGING", "COMPLETE"] as const;

const Patch = z.object({
  id: z.string().min(1),
  stage: z.enum(STAGES).optional(),
  completedQty: z.coerce.number().int().min(0).optional(),
  targetQty: z.coerce.number().int().min(1).optional(),
  inCharge: z.string().trim().max(120).optional().or(z.literal("")),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const PATCH = ownerRoute(Patch, async (d, _req, owner) => {
  const batch = await db.productionBatch.findUnique({ where: { id: d.id } });
  if (!batch) return NextResponse.json({ error: "Batch not found." }, { status: 404 });

  const targetQty = d.targetQty ?? batch.targetQty;
  const completedQty = Math.min(d.completedQty ?? batch.completedQty, targetQty);

  // Progress is derived, so it can never drift from the quantities.
  const progressPct = Math.round((completedQty / targetQty) * 100);
  const stage = d.stage ?? (progressPct >= 100 ? "COMPLETE" : batch.stage);

  const updated = await db.productionBatch.update({
    where: { id: d.id },
    data: {
      stage,
      completedQty,
      targetQty,
      progressPct,
      inCharge: d.inCharge === undefined ? undefined : d.inCharge || null,
      notes: d.notes === undefined ? undefined : d.notes || null,
    },
  });

  await audit(owner.id, "batch.update", "ProductionBatch", updated.id);
  return NextResponse.json({ ok: true, progressPct: updated.progressPct, stage: updated.stage });
});
