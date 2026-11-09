import { db } from "@/lib/db";
import OrdersManager, { type OrderRow } from "@/components/owner/managers/OrdersManager";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const { new: newFlag } = await searchParams;
  const canCreate = newFlag === "1";

  let rows: OrderRow[] = [];
  try {
    const all = await db.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
      select: {
        id: true, orderNo: true, customerName: true, status: true, paymentStatus: true,
        channel: true, total: true, paidAmount: true, createdAt: true, isSample: true,
        _count: { select: { items: true } },
      },
    });
    rows = all.map((r) => ({
      id: r.id, orderNo: r.orderNo, customerName: r.customerName, status: r.status,
      paymentStatus: r.paymentStatus, channel: r.channel,
      total: Number(r.total), paidAmount: Number(r.paidAmount),
      createdAt: r.createdAt.toISOString(), itemCount: r._count.items, isSample: r.isSample,
    }));
  } catch (e) {
    console.warn("[owner/orders page] list failed:", (e as Error).message);
  }

  return (
    <>
      <OrdersManager initial={rows} />
      {canCreate && <QuickActions openNew="orders" />}
    </>
  );
}