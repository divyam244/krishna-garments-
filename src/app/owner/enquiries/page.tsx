import { db } from "@/lib/db";
import EnquiriesManager, { type EnquiryRow } from "@/components/owner/managers/EnquiriesManager";

export const dynamic = "force-dynamic";

export default async function EnquiriesPage() {
  let rows: EnquiryRow[] = [];
  try {
    const all = await db.enquiry.findMany({ orderBy: { createdAt: "desc" }, take: 300 });
    rows = all.map((e) => ({
      id: e.id, reference: e.reference, type: e.type, status: e.status,
      name: e.name, businessName: e.businessName ?? "", phone: e.phone,
      email: e.email ?? "", city: e.city ?? "", products: e.products ?? "",
      quantity: e.quantity ?? "", message: e.message ?? "",
      reply: e.reply ?? "", handledBy: e.handledBy ?? "",
      createdAt: e.createdAt.toISOString(),
    }));
  } catch (e) {
    console.warn("[owner/enquiries page] list failed:", (e as Error).message);
  }

  return <EnquiriesManager initial={rows} />;
}