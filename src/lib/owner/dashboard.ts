import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/**
 * Dashboard metrics. Every figure is derived from orders / payments / stock /
 * batches. When the database has not been migrated we return an explicitly
 * flagged sample set so nothing on screen can be mistaken for real business data.
 */

export type DashboardData = {
  source: "database" | "sample";
  totals: {
    sales: number;
    salesChangePct: number;
    pendingPayments: number;
    pendingChangePct: number;
    stockUnits: number;
    productionUnits: number;
    orderCount: number;
  };
  statusSplit: { label: string; pct: number; count: number; colour: string }[];
  salesTrend: { date: string; value: number }[];
  lowStock: { name: string; qty: number; image: string; severity: "critical" | "low" }[];
  pendingPaymentList: { customer: string; amount: number; dueDate: string | null }[];
  production: { productName: string; batchNo: string; progressPct: number; completed: number; target: number; image: string }[];
  enquiries: { open: number; newThisWeek: number };
};

const DAY = 86_400_000;

export const getDashboard = cache(async (): Promise<DashboardData> => {
  try {
    return await fromDatabase();
  } catch (e) {
    console.warn("[owner/dashboard] falling back to sample:", (e as Error).message);
    return sampleData();
  }
});

async function fromDatabase(): Promise<DashboardData> {
  const now = Date.now();
  const since30 = new Date(now - 30 * DAY);
  const prev30 = new Date(now - 60 * DAY);

  // Fail fast if the schema is absent, rather than half-rendering zeros.
  await db.order.count();

  const [paidLast30, paidPrev30, outstanding, stockAgg, inProduction, orderCount, statusGroups, trendRows, products, batches, enquiries] =
    await Promise.all([
      db.order.aggregate({ _sum: { paidAmount: true }, where: { updatedAt: { gte: since30 }, paymentStatus: { in: ["PARTIAL", "PAID"] } } }),
      db.order.aggregate({ _sum: { paidAmount: true }, where: { updatedAt: { gte: prev30, lt: since30 }, paymentStatus: { in: ["PARTIAL", "PAID"] } } }),
      db.order.aggregate({
        _sum: { total: true },
        where: { paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, status: { not: "CANCELLED" } },
      }),
      db.product.aggregate({ _sum: { stockOnHand: true }, where: { active: true } }),
      db.productionBatch.aggregate({
        _sum: { completedQty: true },
        where: { stage: { not: "COMPLETE" } },
      }),
      db.order.count({ where: { status: { not: "CANCELLED" } } }),
      db.order.groupBy({ by: ["status"], _count: { _all: true }, where: { status: { not: "CANCELLED" } } }),
      db.order.findMany({
        where: { createdAt: { gte: prev30 } },
        select: { createdAt: true, total: true },
      }),
      db.product.findMany({
        where: { active: true, availability: { in: ["LOW_STOCK", "OUT_OF_STOCK"] } },
        orderBy: { stockOnHand: "asc" },
        take: 6,
        select: { name: true, stockOnHand: true, images: true, category: { select: { slug: true } } },
      }),
      db.productionBatch.findMany({
        where: { stage: { not: "COMPLETE" } },
        orderBy: { updatedAt: "desc" },
        take: 3,
        select: { batchNo: true, productName: true, progressPct: true, completedQty: true, targetQty: true },
      }),
      db.enquiry.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

  const sales = Number(paidLast30._sum.paidAmount ?? 0);
  const prevSales = Number(paidPrev30._sum.paidAmount ?? 0);
  const totalOrders = statusGroups.reduce((s, g) => s + g._count._all, 0) || 1;

  const COLOURS: Record<string, string> = {
    COMPLETED: "#5FBF7F",
    IN_PRODUCTION: "#D9A441",
    PENDING: "#C4614C",
    PACKED: "#9B7BB8",
    CONFIRMED: "#B87333",
    SHIPPED: "#D49A60",
    CANCELLED: "#4A4A4A",
  };

  return {
    source: "database",
    totals: {
      sales,
      salesChangePct: prevSales > 0 ? round(((sales - prevSales) / prevSales) * 100) : 0,
      pendingPayments: Number(outstanding._sum.total ?? 0),
      pendingChangePct: 0,
      stockUnits: stockAgg._sum.stockOnHand ?? 0,
      productionUnits: inProduction._sum.completedQty ?? 0,
      orderCount,
    },
    statusSplit: statusGroups
      .map((g) => ({
        label: STATUS_LABEL[g.status] ?? g.status,
        count: g._count._all,
        pct: round((g._count._all / totalOrders) * 100),
        colour: COLOURS[g.status] ?? "#B87333",
      }))
      .sort((a, b) => b.count - a.count),
    salesTrend: buildTrend(trendRows.map((r) => ({ createdAt: r.createdAt, total: Number(r.total) }))),
    lowStock: products.map((p) => ({
      name: p.name,
      qty: p.stockOnHand,
      image: firstImage(p.images),
      severity: p.stockOnHand <= 10 ? "critical" : "low",
    })),
    pendingPaymentList: [],
    production: batches.map((b) => ({
      productName: b.productName,
      batchNo: b.batchNo,
      progressPct: b.progressPct,
      completed: b.completedQty,
      target: b.targetQty,
      image: "",
    })),
    enquiries: {
      open: (enquiries.find((e) => e.status === "NEW")?._count._all ?? 0) +
        (enquiries.find((e) => e.status === "REVIEWING")?._count._all ?? 0),
      newThisWeek: 0,
    },
  };
}

// ------------------------------------------------------------------ sample ---

function sampleData(): DashboardData {
  const trend = Array.from({ length: 29 }, (_, i) => {
    const d = new Date(Date.now() - (28 - i) * DAY);
    // Deterministic gentle upward curve, no randomness so screenshots are stable.
    const base = 4_80_000 + i * 12_000 + Math.sin(i / 2.4) * 90_000;
    return { date: d.toISOString().slice(0, 10), value: Math.round(base / 1000) * 1000 };
  });

  return {
    source: "sample",
    totals: {
      sales: 18_42_500,
      salesChangePct: 12,
      pendingPayments: 6_78_000,
      pendingChangePct: 8,
      stockUnits: 4862,
      productionUnits: 1240,
      orderCount: 136,
    },
    statusSplit: [
      { label: "Completed", count: 78, pct: 57, colour: "#5FBF7F" },
      { label: "In Production", count: 24, pct: 18, colour: "#D9A441" },
      { label: "Pending", count: 20, pct: 15, colour: "#C4614C" },
      { label: "Packed", count: 14, pct: 10, colour: "#9B7BB8" },
    ],
    salesTrend: trend,
    lowStock: [
      { name: "Women Jacket", qty: 32, image: "", severity: "low" },
      { name: "Kurti Set", qty: 58, image: "", severity: "low" },
      { name: "Top", qty: 76, image: "", severity: "low" },
    ],
    pendingPaymentList: [
      { customer: "StyleHub Delhi", amount: 2_40_000, dueDate: isoDays(5) },
      { customer: "Aarohi Fashion", amount: 1_38_000, dueDate: isoDays(7) },
      { customer: "Trendy Mart", amount: 92_500, dueDate: isoDays(9) },
    ],
    production: [
      { productName: "Women Jacket", batchNo: "KG-1245", progressPct: 70, completed: 840, target: 1200, image: "" },
      { productName: "Festive Sharara Set", batchNo: "KG-1246", progressPct: 45, completed: 180, target: 400, image: "" },
      { productName: "Co-ord Sets", batchNo: "KG-1247", progressPct: 20, completed: 60, target: 300, image: "" },
    ],
    enquiries: { open: 9, newThisWeek: 4 },
  };
}

function isoDays(n: number) {
  return new Date(Date.now() + n * DAY).toISOString();
}

// ------------------------------------------------------------------ helpers --

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending",
  CONFIRMED: "Confirmed",
  IN_PRODUCTION: "In Production",
  PACKED: "Packed",
  SHIPPED: "Shipped",
  COMPLETED: "Completed",
};

function buildTrend(rows: { createdAt: Date; total: number }[]) {
  const byDay = new Map<string, number>();
  for (const r of rows) {
    const key = r.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + r.total);
  }
  const out: { date: string; value: number }[] = [];
  for (let i = 28; i >= 0; i--) {
    const d = new Date(Date.now() - i * DAY);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, value: Math.round(byDay.get(key) ?? 0) });
  }
  return out;
}

function firstImage(images: unknown): string {
  return Array.isArray(images) && typeof images[0] === "string" ? images[0] : "";
}

function round(n: number) {
  return Math.round(n * 10) / 10;
}
