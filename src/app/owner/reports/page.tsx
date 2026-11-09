import { db } from "@/lib/db";
import ReportsView, { type ReportData } from "@/components/owner/managers/ReportsView";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = Date.now();
  const DAY = 86_400_000;

  let data: ReportData | null = null;
  try {
    await db.order.count();

    const since30 = await db.order.findMany({
      where: { createdAt: { gte: new Date(now - 30 * DAY) }, paymentStatus: { in: ["PARTIAL", "PAID"] } },
      select: { createdAt: true, total: true },
    });
    const prev30 = await db.order.findMany({
      where: { createdAt: { gte: new Date(now - 60 * DAY), lt: new Date(now - 30 * DAY) }, paymentStatus: { in: ["PARTIAL", "PAID"] } },
      select: { createdAt: true, total: true },
    });
    const outstanding = await db.order.aggregate({
      _sum: { total: true },
      where: { paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, status: { not: "CANCELLED" } },
    });
    const orders365 = await db.order.findMany({
      where: { createdAt: { gte: new Date(now - 365 * DAY) }, paymentStatus: { in: ["PARTIAL", "PAID"] } },
      select: { id: true, createdAt: true, total: true, items: { select: { quantity: true, lineTotal: true, product: { select: { category: { select: { name: true } } } } } } },
    });
    const statusGroups = await db.order.groupBy({
      by: ["status"], _count: { _all: true },
      where: { status: { not: "CANCELLED" } },
    });
    const trendRows = await db.order.findMany({
      where: { createdAt: { gte: new Date(now - 365 * DAY) }, paymentStatus: { in: ["PARTIAL", "PAID"] } },
      select: { createdAt: true, total: true },
    });

    const agg = (rows: any[]) => rows.reduce((s: number, r: any) => s + Number(r.total), 0);
    const revenue30 = agg(since30);
    const outstandingAmt = Number(outstanding._sum.total ?? 0);

    const byCategoryMap = new Map<string, { value: number; units: number }>();
    for (const o of orders365) {
      for (const i of o.items) {
        const name = i.product?.category?.name ?? "Unclassified";
        const entry = byCategoryMap.get(name) ?? { value: 0, units: 0 };
        entry.units += Number(i.quantity);
        entry.value += Number(i.lineTotal ?? 0);
        byCategoryMap.set(name, entry);
      }
    }
    const byCategory = Array.from(byCategoryMap, ([name, { value, units }]) => ({ name, value, units }));

    const byStatus = statusGroups.map((g: any) => ({
      label: STATUS_LABEL[g.status] ?? g.status,
      count: g._count._all,
      colour: COLOURS[g.status] ?? "#B87333",
    }));

    const monthlyMap = new Map<string, number>();
    for (const r of trendRows) {
      const d = new Date(r.createdAt);
      const label = d.toLocaleString("en-IN", { month: "short", year: "2-digit" });
      monthlyMap.set(label, (monthlyMap.get(label) ?? 0) + Number(r.total));
    }
    const monthlyList = Array.from(monthlyMap, ([label, value]) => ({ label, value }))
      .sort((a, b) => new Date(a.label).getTime() - new Date(b.label).getTime());

    data = {
      range: { days: 365, label: "Last 365 days" },
      revenue: revenue30,
      collected: revenue30 - outstandingAmt,
      outstanding: outstandingAmt,
      orders: orders365.length,
      averageOrderValue: orders365.length ? revenue30 / orders365.length : 0,
      unitsSold: orders365.reduce((s: number, o: any) => s + o.items.reduce((a: number, i: any) => a + Number(i.quantity), 0), 0),
      byCategory: byCategory.length ? byCategory : [{ name: "No sales yet", value: 0, units: 0 }],
      byStatus,
      monthly: monthlyList.length ? monthlyList : [{ label: "No sales yet", value: 0 }],
    };
  } catch (e) {
    console.warn("[owner/reports page] report failed:", (e as Error).message);
  }

  if (!data) {
    return (
      <div className="card p-14 text-center">
        <h2 className="font-display text-xl text-champagne">Database not connected</h2>
        <p className="mt-2 text-[13px] text-ivory/50">Configure DATABASE_URL and run "npm run db:migrate" to see real figures.</p>
      </div>
    );
  }

  return <ReportsView data={data} />;
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending", CONFIRMED: "Confirmed", IN_PRODUCTION: "In production",
  PACKED: "Packed", SHIPPED: "Shipped", COMPLETED: "Completed", CANCELLED: "Cancelled",
};

const COLOURS: Record<string, string> = {
  COMPLETED: "#5FBF7F", IN_PRODUCTION: "#D9A441", PENDING: "#C4614C", PACKED: "#9B7BB8",
  CONFIRMED: "#B87333", SHIPPED: "#D49A60", CANCELLED: "#4A4A4A",
};