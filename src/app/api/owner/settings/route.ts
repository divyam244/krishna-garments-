import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { ownerRoute, audit } from "@/lib/owner/route-helper";

const Schema = z.object({
  key: z.string().trim().min(1).max(80),
  value: z.string().max(4000),
});

/** Editable business settings (WhatsApp number, email, shipping threshold…). */
export const POST = ownerRoute(Schema, async (d, _req, owner) => {
  const setting = await db.setting.upsert({
    where: { key: d.key },
    create: { key: d.key, value: d.value },
    update: { value: d.value },
  });
  await audit(owner.id, "setting.update", "Setting", setting.key);
  return NextResponse.json({ ok: true, key: setting.key });
});
