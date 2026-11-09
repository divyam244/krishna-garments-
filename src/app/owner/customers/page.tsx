import { db } from "@/lib/db";
import CustomersManager, { type CustomerRow } from "@/components/owner/managers/CustomersManager";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const { new: newFlag } = await searchParams;
  const canCreate = newFlag === "1";

  let rows: CustomerRow[] = [];
  try {
    const all = await db.customer.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { orders: true } }, orders: { select: { total: true, paidAmount: true } } },
    });
    rows = all.map((c) => ({
      id: c.id, name: c.name, company: c.company ?? "", phone: c.phone ?? "",
      email: c.email ?? "", city: c.city ?? "", gstin: c.gstin ?? "", type: c.type,
      notes: c.notes ?? "", orderCount: c._count.orders,
      lifetimeValue: c.orders.reduce((s, o) => s + Number(o.total), 0),
      outstanding: c.orders.reduce((s, o) => s + Math.max(0, Number(o.total) - Number(o.paidAmount)), 0),
      isSample: c.isSample, createdAt: c.createdAt.toISOString(),
    }));
  } catch (e) {
    console.warn("[owner/customers page] list failed:", (e as Error).message);
  }

  return (
    <>
      <CustomersManager initial={rows} />
      {canCreate && <QuickActions openNew="customers" />}
    </>
  );
}