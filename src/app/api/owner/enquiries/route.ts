import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireOwner } from "@/lib/auth/session";

/** Enquiry inbox for the business desk. */
export async function GET() {
  const owner = await requireOwner().catch(() => null);
  if (!owner) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

  try {
    const rows = await db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
    return NextResponse.json(
      rows.map((e) => ({
        id: e.id,
        reference: e.reference,
        type: e.type,
        status: e.status,
        name: e.name,
        businessName: e.businessName ?? "",
        phone: e.phone,
        email: e.email ?? "",
        city: e.city ?? "",
        products: e.products ?? "",
        quantity: e.quantity ?? "",
        message: e.message ?? "",
        reply: e.reply ?? "",
        handledBy: e.handledBy ?? "",
        createdAt: e.createdAt.toISOString(),
      })),
    );
  } catch (e) {
    console.warn("[owner/enquiries] list failed:", (e as Error).message);
    return NextResponse.json([]);
  }
}
