"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Loader2, Eye, Check, XCircle } from "lucide-react";
import DataTable, { StatusPill } from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { money, num, date as fmtDate } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type OrderRow = {
  id: string;
  orderNo: string;
  customerName: string;
  status: string;
  paymentStatus: string;
  channel: string;
  total: number;
  paidAmount: number;
  createdAt: string;
  itemCount: number;
  isSample: boolean;
};

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  PENDING: { label: "Pending", tone: "border-danger/50 bg-danger/12 text-danger" },
  CONFIRMED: { label: "Confirmed", tone: "border-copper/50 bg-copper/12 text-champagne" },
  IN_PRODUCTION: { label: "In Production", tone: "border-warn/50 bg-warn/12 text-warn" },
  PACKED: { label: "Packed", tone: "border-[#9B7BB8]/50 bg-[#9B7BB8]/12 text-[#C4A6DC]" },
  SHIPPED: { label: "Shipped", tone: "border-champagne/50 bg-champagne/12 text-champagne" },
  COMPLETED: { label: "Completed", tone: "border-ok/50 bg-ok/12 text-ok" },
  CANCELLED: { label: "Cancelled", tone: "border-ivory/25 bg-ivory/8 text-ivory/50" },
};

const PAY_MAP: Record<string, { label: string; tone: string }> = {
  UNPAID: { label: "Unpaid", tone: "border-danger/50 bg-danger/12 text-danger" },
  PARTIAL: { label: "Partial", tone: "border-warn/50 bg-warn/12 text-warn" },
  PAID: { label: "Paid", tone: "border-ok/50 bg-ok/12 text-ok" },
  OVERDUE: { label: "Overdue", tone: "border-danger/50 bg-danger/12 text-danger" },
};

export default function OrdersManager({ initial }: { initial: OrderRow[] }) {
  const { toast } = useSite();
  const [rows, setRows] = useState(initial);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [detail, setDetail] = useState<OrderRow | null>(null);

  async function refresh() {
    try {
      const res = await fetch("/api/owner/orders");
      if (res.ok) setRows(await res.json());
    } catch {
      /* keep the server-rendered rows on a network hiccup */
    }
  }

  const totals = useMemo(
    () => ({
      revenue: rows.reduce((s, r) => s + Number(r.total), 0),
      due: rows.reduce((s, r) => s + Math.max(0, Number(r.total) - Number(r.paidAmount)), 0),
      open: rows.filter((r) => r.status !== "COMPLETED" && r.status !== "CANCELLED").length,
    }),
    [rows],
  );

  async function advance(order: OrderRow, next: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/owner/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not update the order.");
      setRows((rs) => rs.map((r) => (r.id === order.id ? { ...r, status: next } : r)));
      toast(`${order.orderNo} → ${STATUS_MAP[next]?.label ?? next}`, "success");
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const createFields: Field[] = [
    { name: "customerName", label: "Customer / business name", type: "text", required: true, placeholder: "StyleHub Delhi" },
    { name: "channel", label: "Channel", type: "select", options: [{ value: "WHOLESALE", label: "Wholesale" }, { value: "CUSTOM", label: "Custom stitching" }, { value: "ONLINE", label: "Online retail" }] },
    { name: "status", label: "Status", type: "select", options: Object.entries(STATUS_MAP).map(([value, v]) => ({ value, label: v.label })) },
    { name: "paymentStatus", label: "Payment status", type: "select", options: Object.entries(PAY_MAP).map(([value, v]) => ({ value, label: v.label })) },
    { name: "itemLabel", label: "Item description", type: "text", required: true, span: 2, placeholder: "Embroidered jacket — size set S/M/L" },
    { name: "unitPrice", label: "Unit price (₹)", type: "number", required: true, placeholder: "2999" },
    { name: "quantity", label: "Quantity", type: "number", required: true, placeholder: "50" },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Delivery window, fabric reference, invoice requirements…" },
  ];

  async function createOrder(data: Record<string, string | number | boolean>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/owner/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: data.customerName,
          channel: data.channel,
          status: data.status,
          paymentStatus: data.paymentStatus,
          notes: data.notes,
          items: [{ label: data.itemLabel, unitPrice: Number(data.unitPrice || 0), quantity: Number(data.quantity || 1) }],
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not create the order.");
      toast(`Order ${json.orderNo} created`, "success");
      setCreating(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader title="Orders" subtitle="Retail, wholesale and custom orders in one queue." count={rows.length}>
        <button type="button" onClick={() => setCreating(true)} className="btn-solid btn-sm">
          <Plus size={14} /> New Order
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Order value" value={money(totals.revenue)} />
        <Stat label="Outstanding" value={money(totals.due)} tone="text-danger" />
        <Stat label="Open orders" value={num(totals.open)} />
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyText="No orders recorded yet. Create one or wait for online checkout orders to arrive here."
        onRowClick={setDetail}
        columns={[
          { key: "orderNo", header: "Order", render: (r) => <span className="whitespace-nowrap font-medium text-champagne">{r.orderNo}</span> },
          { key: "customerName", header: "Customer", search: (r) => `${r.customerName} ${r.orderNo}` },
          { key: "channel", header: "Channel", render: (r) => <span className="capitalize text-ivory/60">{r.channel.toLowerCase()}</span> },
          { key: "total", header: "Value", render: (r) => <span className="tabular-nums">{money(Number(r.total))}</span>, search: (r) => String(r.total) },
          {
            key: "paymentStatus",
            header: "Payment",
            render: (r) => <StatusPill value={r.paymentStatus} map={PAY_MAP} />,
          },
          { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} map={STATUS_MAP} /> },
          { key: "createdAt", header: "Placed", render: (r) => <span className="whitespace-nowrap text-ivory/55">{fmtDate(r.createdAt)}</span>, search: (r) => r.createdAt },
        ]}
        actions={(r) => (
          <div className="flex justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button type="button" onClick={() => setDetail(r)} aria-label={`View ${r.orderNo}`} className="grid h-8 w-8 place-items-center rounded border border-copper/30 text-champagne hover:bg-espresso disabled:opacity-40" disabled={busy}>
              <Eye size={13} />
            </button>
            {r.status !== "COMPLETED" && r.status !== "CANCELLED" && (
              <button type="button" onClick={() => advance(r, "COMPLETED")} aria-label={`Mark ${r.orderNo} completed`} className="grid h-8 w-8 place-items-center rounded border border-ok/40 text-ok hover:bg-ok/12 disabled:opacity-40" disabled={busy}>
                <Check size={13} />
              </button>
            )}
            {r.status !== "CANCELLED" && (
              <button type="button" onClick={() => advance(r, "CANCELLED")} aria-label={`Cancel ${r.orderNo}`} className="grid h-8 w-8 place-items-center rounded border border-danger/40 text-danger hover:bg-danger/12 disabled:opacity-40" disabled={busy}>
                <XCircle size={13} />
              </button>
            )}
          </div>
        )}
      />

      {creating && (
        <FormModal title="New Order" fields={createFields} busy={busy} error={error} submitLabel="Create order" onSubmit={createOrder} onClose={() => { setCreating(false); setError(""); }} />
      )}

      {detail && <OrderDetail order={detail} onClose={() => setDetail(null)} onAdvance={advance} />}
    </>
  );
}

export function PageHeader({
  title,
  subtitle,
  count,
  children,
}: {
  title: string;
  subtitle: string;
  count?: number;
  children?: React.ReactNode;
}) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-[30px] leading-tight md:text-[36px]">{title}</h1>
        <p className="mt-1.5 text-[13px] text-ivory/50">{subtitle}</p>
      </div>
      <div className="flex items-center gap-3">
        {count != null && <span className="chip">{count} records</span>}
        {children}
      </div>
    </header>
  );
}

function Stat({ label, value, tone = "text-champagne" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="card-espresso px-5 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/45">{label}</p>
      <p className={`mt-1.5 font-display text-[24px] leading-none ${tone}`}>{value}</p>
    </div>
  );
}

function OrderDetail({
  order,
  onClose,
  onAdvance,
}: {
  order: OrderRow;
  onClose: () => void;
  onAdvance: (o: OrderRow, s: string) => void;
}) {
  const [items, setItems] = useState<{ label: string; size: string | null; colour: string | null; unitPrice: number; quantity: number; lineTotal: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/owner/orders/${order.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [order.id]);

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Order ${order.orderNo}`}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-xl border border-copper/30 bg-deep p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-champagne/70">{order.orderNo}</p>
            <h2 className="mt-1 font-display text-[26px] leading-tight">{order.customerName}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full border border-copper/35 text-champagne hover:bg-espresso">
            <XCircle size={15} />
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
          <Info term="Channel" value={order.channel} />
          <Info term="Placed" value={fmtDate(order.createdAt)} />
          <Info term="Status" value={STATUS_MAP[order.status]?.label ?? order.status} />
          <Info term="Payment" value={PAY_MAP[order.paymentStatus]?.label ?? order.paymentStatus} />
          <Info term="Order value" value={money(Number(order.total))} />
          <Info term="Received" value={money(Number(order.paidAmount))} />
        </dl>

        <h3 className="mt-6 mb-2 text-[11px] uppercase tracking-[0.2em] text-champagne/75">Line items</h3>
        {loading ? (
          <p className="flex items-center gap-2 py-4 text-[13px] text-ivory/45"><Loader2 size={14} className="animate-spin" /> Loading…</p>
        ) : items.length === 0 ? (
          <p className="py-4 text-[13px] text-ivory/45">No item detail stored for this order.</p>
        ) : (
          <ul className="divide-y divide-copper/12 border-y border-copper/20">
            {items.map((i, n) => (
              <li key={n} className="flex items-start justify-between gap-4 py-3 text-[13px]">
                <span className="min-w-0">
                  <span className="block text-ivory/85">{i.label}</span>
                  <span className="text-[11px] text-ivory/40">
                    {[i.size, i.colour].filter(Boolean).join(" · ") || "Standard"} · {num(i.quantity)} × {money(Number(i.unitPrice))}
                  </span>
                </span>
                <span className="shrink-0 tabular-nums text-champagne">{money(Number(i.lineTotal))}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {["CONFIRMED", "IN_PRODUCTION", "PACKED", "SHIPPED", "COMPLETED"].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => { onAdvance(order, s); onClose(); }}
              disabled={busyish(order.status, s)}
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors ${
                order.status === s ? "border-copper bg-copper/18 text-champagne" : "border-ivory/18 text-ivory/60 hover:border-copper/55"
              }`}
            >
              {STATUS_MAP[s]?.label ?? s}
            </button>
          ))}
        </div>

        {order.isSample && <p className="sample-tag mt-5 w-fit">Sample record</p>}
      </div>
    </div>
  );
}

function Info({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded border border-copper/20 bg-charcoal/50 p-3">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ivory/40">{term}</dt>
      <dd className="mt-1 capitalize text-ivory/85">{value.toLowerCase().replace(/_/g, " ")}</dd>
    </div>
  );
}

function busyish(current: string, target: string) {
  return current === target;
}
