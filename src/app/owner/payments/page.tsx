import { db } from "@/lib/db";
import PaymentsManager, { type Receivable, type Receipt } from "@/components/owner/managers/PaymentsManager";
import { QuickActions } from "@/components/owner/QuickActions";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const { new: newFlag } = await searchParams;
  const canCreate = newFlag === "1";

  let receivables: Receivable[] = [];
  let receipts: Receipt[] = [];
  try {
    const [orders, payments] = await Promise.all([
      db.order.findMany({
        where: { paymentStatus: { in: ["UNPAID", "PARTIAL", "OVERDUE"] }, status: { not: "CANCELLED" } },
        orderBy: { dueDate: { sort: "asc", nulls: "last" } },
        take: 300,
        select: { id: true, orderNo: true, customerName: true, total: true, paidAmount: true, dueDate: true, paymentStatus: true, createdAt: true, isSample: true },
      }),
      db.payment.findMany({ orderBy: { recordedAt: "desc" }, take: 120 }),
    ]);
    receivables = orders.map((o) => ({
      orderId: o.id, orderNo: o.orderNo, customer: o.customerName,
      total: Number(o.total), paid: Number(o.paidAmount),
      balance: Math.max(0, Number(o.total) - Number(o.paidAmount)),
      dueDate: o.dueDate?.toISOString() ?? null,
      paymentStatus: o.paymentStatus, placedAt: o.createdAt.toISOString(), isSample: o.isSample,
    }));
    receipts = payments.map((p) => ({
      id: p.id, receiptNo: p.receiptNo, amount: Number(p.amount), method: p.method,
      status: p.status, recordedAt: p.recordedAt.toISOString(), isSample: p.isSample,
    }));
  } catch (e) {
    console.warn("[owner/payments page] list failed:", (e as Error).message);
  }

  return (
    <>
      <PaymentsManager receivables={receivables} receipts={receipts} />
      {canCreate && <QuickActions openNew="payments" />}
    </>
  );
}