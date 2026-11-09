"use client";

import { useMemo, useState } from "react";
import { CreditCard, Plus, History } from "lucide-react";
import DataTable, { StatusPill } from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { PageHeader } from "./OrdersManager";
import { Stat } from "./InventoryManager";
import { money, date as fmtDate, daysFromNow } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type Receivable = {
  orderId: string;
  orderNo: string;
  customer: string;
  total: number;
  paid: number;
  balance: number;
  dueDate: string | null;
  paymentStatus: string;
  placedAt: string;
  isSample: boolean;
};

export type Receipt = {
  id: string;
  receiptNo: string;
  amount: number;
  method: string;
  status: string;
  recordedAt: string;
  isSample: boolean;
};

const PAY_MAP: Record<string, { label: string; tone: string }> = {
  UNPAID: { label: "Unpaid", tone: "border-danger/50 bg-danger/12 text-danger" },
  PARTIAL: { label: "Partial", tone: "border-warn/50 bg-warn/12 text-warn" },
  PAID: { label: "Paid", tone: "border-ok/50 bg-ok/12 text-ok" },
  OVERDUE: { label: "Overdue", tone: "border-danger/50 bg-danger/12 text-danger" },
};

export default function PaymentsManager({
  receivables,
  receipts,
}: {
  receivables: Receivable[];
  receipts: Receipt[];
}) {
  const { toast } = useSite();
  const [rows, setRows] = useState(receivables);
  const [history, setHistory] = useState(receipts);
  const [collecting, setCollecting] = useState<Receivable | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(
    () => ({
      outstanding: rows.reduce((s, r) => s + r.balance, 0),
      overdue: rows.filter((r) => r.dueDate && new Date(r.dueDate) < new Date()).length,
      collected30: history
        .filter((h) => Date.now() - new Date(h.recordedAt).getTime() < 30 * 86_400_000)
        .reduce((s, h) => s + h.amount, 0),
    }),
    [rows, history],
  );

  async function refresh() {
    try {
      const res = await fetch("/api/owner/payments");
      if (res.ok) {
        const data = await res.json();
        setRows(data.receivables ?? []);
        setHistory(data.receipts ?? []);
      }
    } catch { /* keep current */ }
  }

  const fields: Field[] = [
    { name: "amount", label: "Amount received (₹)", type: "number", required: true, placeholder: "50000" },
    {
      name: "method",
      label: "Method",
      type: "select",
      options: [
        { value: "BANK", label: "Bank transfer" },
        { value: "UPI", label: "UPI" },
        { value: "CASH", label: "Cash" },
        { value: "CARD", label: "Card" },
      ],
    },
  ];

  async function record(data: Record<string, string | number | boolean>) {
    if (!collecting) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/owner/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: collecting.orderId, amount: Number(data.amount), method: data.method }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not record the payment.");
      toast(`${json.receiptNo} recorded — ${money(collecting.total - json.paid)} still due`, "success");
      setCollecting(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Payments" subtitle="Outstanding balances and receipts against every order." count={rows.length}>
        <button type="button" onClick={() => setShowHistory(true)} className="btn-outline btn-sm">
          <History size={14} /> Receipts
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Total outstanding" value={money(stats.outstanding)} tone={stats.outstanding > 0 ? "text-danger" : "text-ok"} />
        <Stat label="Overdue orders" value={String(stats.overdue)} tone={stats.overdue > 0 ? "text-danger" : "text-ok"} />
        <Stat label="Collected (30 days)" value={money(stats.collected30)} tone="text-ok" />
      </div>

      {rows.length === 0 ? (
        <div className="card flex flex-col items-center gap-3 p-14 text-center">
          <span className="grid h-14 w-14 place-items-center rounded-full border border-copper/30 text-champagne/60">
            <CreditCard size={22} />
          </span>
          <h2 className="font-display text-2xl">Nothing outstanding</h2>
          <p className="max-w-md text-[13px] leading-relaxed text-ivory/50">
            Every recorded order has been settled. Receipts remain available in the history.
          </p>
        </div>
      ) : (
        <DataTable
          rows={rows}
          rowKey={(r) => r.orderId}
          emptyText="No open balances."
          columns={[
            { key: "orderNo", header: "Order", render: (r) => <span className="whitespace-nowrap text-champagne">{r.orderNo}</span>, search: (r) => `${r.orderNo} ${r.customer}` },
            { key: "customer", header: "Customer" },
            { key: "total", header: "Order value", render: (r) => <span className="tabular-nums">{money(r.total)}</span>, search: (r) => String(r.total) },
            { key: "paid", header: "Received", render: (r) => <span className="tabular-nums text-ok">{money(r.paid)}</span>, search: (r) => String(r.paid) },
            { key: "balance", header: "Balance due", render: (r) => <span className="tabular-nums text-danger">{money(r.balance)}</span>, search: (r) => String(r.balance) },
            {
              key: "dueDate",
              header: "Due",
              render: (r) => {
                const d = daysFromNow(r.dueDate);
                return <span className={`whitespace-nowrap ${d.overdue ? "text-danger" : "text-ivory/60"}`}>{d.label}</span>;
              },
              search: (r) => r.dueDate ?? "",
            },
            { key: "paymentStatus", header: "Status", render: (r) => <StatusPill value={r.paymentStatus} map={PAY_MAP} /> },
          ]}
          actions={(r) => (
            <button
              type="button"
              onClick={() => { setCollecting(r); setError(""); }}
              aria-label={`Record payment for ${r.orderNo}`}
              className="inline-flex items-center gap-1.5 rounded border border-copper/35 px-2.5 py-1.5 text-[11px] uppercase tracking-[0.12em] text-champagne hover:bg-espresso"
            >
              <Plus size={13} /> Collect
            </button>
          )}
        />
      )}

      {collecting && (
        <FormModal
          title={`Collect payment — ${collecting.orderNo}`}
          fields={fields}
          busy={busy}
          error={error}
          submitLabel="Record receipt"
          onSubmit={record}
          onClose={() => { setCollecting(null); setError(""); }}
        />
      )}

      {showHistory && (
        <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm" onClick={() => setShowHistory(false)} role="dialog" aria-modal="true" aria-label="Payment receipts">
          <div onClick={(e) => e.stopPropagation()} className="max-h-[88svh] w-full max-w-2xl overflow-y-auto rounded-xl border border-copper/30 bg-deep p-6 shadow-card">
            <h2 className="mb-4 font-display text-[24px]">Receipt history</h2>
            {history.length === 0 ? (
              <p className="py-8 text-center text-[13px] text-ivory/45">No receipts recorded yet.</p>
            ) : (
              <ul className="divide-y divide-copper/12">
                {history.map((h) => (
                  <li key={h.id} className="flex items-center justify-between gap-4 py-3 text-[13px]">
                    <span>
                      <span className="block text-champagne">{h.receiptNo}</span>
                      <span className="text-[11px] text-ivory/45">
                        {fmtDate(h.recordedAt)} · {h.method}
                      </span>
                    </span>
                    <span className="tabular-nums text-ok">{money(h.amount)}</span>
                  </li>
                ))}
              </ul>
            )}
            <button type="button" onClick={() => setShowHistory(false)} className="btn-ghost mt-4">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
