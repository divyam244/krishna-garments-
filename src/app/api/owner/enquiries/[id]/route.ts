import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";
import { requireOwner } from "@/lib/auth/session";

/** Update a single enquiry's status and internal reply. */
const Schema = z.object({
  status: z.enum(["NEW", "REVIEWING", "QUOTED", "CONVERTED", "CLOSED"]).default("REVIEWING"),
  reply: z.string().trim().max(3000).optional().or(z.literal("")),
});

export const PATCH = ownerRoute(Schema, async (d, _req, owner) => {
  const updated = await db.enquiry.update({
    where: { id: d.status },
    data: { status: d.status, reply: d.reply || null },
  });

  if (!updated) return NextResponse.json({ error: "Enquiry not found." }, { status: 404 });

  await audit(owner.id, "enquiry.update", "Enquiry", updated.id);
  return NextResponse.json({ ok: true, id: updated.id, status: updated.status });
});
