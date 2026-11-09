"use client";

import { useState } from "react";
import { MessageSquare, ExternalLink } from "lucide-react";
import DataTable, { StatusPill } from "@/components/owner/DataTable";
import { PageHeader } from "./OrdersManager";
import { Stat } from "./InventoryManager";
import { num, date as fmtDate } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type EnquiryRow = {
  id: string;
  reference: string;
  type: string;
  status: string;
  name: string;
  businessName: string;
  phone: string;
  email: string;
  city: string;
  products: string;
  quantity: string;
  message: string;
  reply: string;
  handledBy: string;
  createdAt: string;
};

const STATUS_MAP: Record<string, { label: string; tone: string }> = {
  NEW: { label: "New", tone: "border-danger/50 bg-danger/12 text-danger" },
  REVIEWING: { label: "Reviewing", tone: "border-warn/50 bg-warn/12 text-warn" },
  QUOTED: { label: "Quoted", tone: "border-copper/50 bg-copper/12 text-champagne" },
  CONVERTED: { label: "Converted", tone: "border-ok/50 bg-ok/12 text-ok" },
  CLOSED: { label: "Closed", tone: "border-ivory/25 text-ivory/50" },
};

const TYPE_LABEL: Record<string, string> = {
  WHOLESALE: "Wholesale",
  BULK_ORDER: "Bulk order",
  CUSTOM_STITCHING: "Custom stitching",
  MANUFACTURING: "Manufacturing",
  GENERAL: "General",
};

export default function EnquiriesManager({ initial }: { initial: EnquiryRow[] }) {
  const { toast } = useSite();
  const [rows, setRows] = useState(initial);
  const [open, setOpen] = useState<EnquiryRow | null>(null);
  const [busy, setBusy] = useState(false);

  async function refresh() {
    try {
      const res = await fetch("/api/owner/enquiries");
      if (res.ok) setRows(await res.json());
    } catch { /* keep rows */ }
  }

  async function setStatus(row: EnquiryRow, status: string, reply?: string) {
    setBusy(true);
    try {
      const res = await fetch(`/api/owner/enquiries/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, reply }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not update the enquiry.");
      toast(`${row.reference} → ${STATUS_MAP[status]?.label ?? status}`, "success");
      setOpen(null);
      await refresh();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setBusy(false);
    }
  }

  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const stats = {
    total: rows.length,
    open: rows.filter((r) => r.status === "NEW" || r.status === "REVIEWING").length,
    converted: rows.filter((r) => r.status === "CONVERTED").length,
  };

  return (
    <>
      <PageHeader title="Business Enquiries" subtitle="Wholesale, bulk, custom stitching and manufacturing requests." count={rows.length} />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Total enquiries" value={num(stats.total)} />
        <Stat label="Awaiting response" value={num(stats.open)} tone={stats.open > 0 ? "text-warn" : "text-ok"} />
        <Stat label="Converted" value={num(stats.converted)} tone="text-ok" />
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyText="No enquiries yet. Submissions from the wholesale page land here automatically."
        onRowClick={setOpen}
        columns={[
          { key: "reference", header: "Reference", render: (r) => <span className="whitespace-nowrap text-champagne">{r.reference}</span>, search: (r) => `${r.reference} ${r.name} ${r.businessName}` },
          { key: "type", header: "Type", render: (r) => <span className="whitespace-nowrap text-ivory/75">{TYPE_LABEL[r.type] ?? r.type}</span> },
          { key: "name", header: "Contact", render: (r) => (
              <span className="block min-w-0">
                <span className="block truncate text-ivory/85">{r.name}</span>
                {r.businessName && <span className="block truncate text-[11px] text-ivory/45">{r.businessName}</span>}
              </span>
            ) },
          { key: "products", header: "Interested in", render: (r) => <span className="line-clamp-1 max-w-[220px] text-ivory/60">{r.products || "—"}</span> },
          { key: "quantity", header: "Qty", render: (r) => <span className="text-ivory/60">{r.quantity || "—"}</span> },
          { key: "status", header: "Status", render: (r) => <StatusPill value={r.status} map={STATUS_MAP} /> },
          { key: "createdAt", header: "Received", render: (r) => <span className="whitespace-nowrap text-ivory/55">{fmtDate(r.createdAt)}</span>, search: (r) => r.createdAt },
        ]}
      />

      {open && <EnquiryDetail row={open} busy={busy} whatsappConfigured={Boolean(wa)} onClose={() => setOpen(null)} onStatus={setStatus} />}
    </>
  );
}

function EnquiryDetail({
  row,
  busy,
  whatsappConfigured,
  onClose,
  onStatus,
}: {
  row: EnquiryRow;
  busy: boolean;
  whatsappConfigured: boolean;
  onClose: () => void;
  onStatus: (r: EnquiryRow, s: string, reply?: string) => Promise<void>;
}) {
  const [reply, setReply] = useState(row.reply);

  return (
    <div className="fixed inset-0 z-[95] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm" onClick={onClose} role="dialog" aria-modal="true" aria-label={`Enquiry ${row.reference}`}>
      <div onClick={(e) => e.stopPropagation()} className="max-h-[90svh] w-full max-w-xl overflow-y-auto rounded-xl border border-copper/30 bg-deep p-6 shadow-card">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-champagne/70">{row.reference}</p>
            <h2 className="mt-1 font-display text-[26px] leading-tight">{row.name}</h2>
            <p className="text-[13px] text-ivory/50">{TYPE_LABEL[row.type] ?? row.type}{row.city ? ` · ${row.city}` : ""}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-copper/35 text-champagne hover:bg-espresso">
            ×
          </button>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-[13px]">
          <Info term="Business" value={row.businessName || "—"} />
          <Info term="Phone" value={row.phone} />
          <Info term="Email" value={row.email || "—"} />
          <Info term="Quantity" value={row.quantity || "—"} />
          <Info term="Products" value={row.products || "—"} />
          <Info term="Handled by" value={row.handledBy || "Unassigned"} />
        </dl>

        {row.message && (
          <div className="mt-5">
            <p className="label">Message</p>
            <p className="rounded border border-copper/20 bg-charcoal/50 p-4 text-[13px] leading-relaxed text-ivory/75">
              {row.message}
            </p>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`tel:${row.phone.replace(/[^\d+]/g, "")}`}
            className="btn-outline btn-sm"
          >
            Call {row.name.split(" ")[0]}
          </a>
          {whatsappConfigured ? (
            <a
              href={`https://wa.me/${row.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hello ${row.name}, regarding your Krishna Garments enquiry ${row.reference}:`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-outline btn-sm"
            >
              <MessageSquare size={13} /> WhatsApp
            </a>
          ) : null}
          {row.email && (
            <a href={`mailto:${row.email}`} className="btn-outline btn-sm">
              <ExternalLink size={13} /> Email
            </a>
          )}
        </div>

        <label className="mt-6 block">
          <span className="label">Internal note / quoted terms</span>
          <textarea rows={3} value={reply} onChange={(e) => setReply(e.target.value)} className="field resize-y" placeholder="Costing agreed, sample dispatched…" />
        </label>

        <div className="mt-5 flex flex-wrap gap-2">
          {Object.keys(STATUS_MAP).map((s) => (
            <button
              key={s}
              type="button"
              disabled={busy || row.status === s}
              onClick={() => onStatus(row, s, reply)}
              className={`rounded-full border px-3 py-1.5 text-[11px] uppercase tracking-[0.14em] transition-colors disabled:opacity-40 ${
                row.status === s ? "border-copper bg-copper/18 text-champagne" : "border-ivory/18 text-ivory/60 hover:border-copper/55"
              }`}
            >
              {STATUS_MAP[s].label}
            </button>
          ))}
          <button type="button" disabled={busy} onClick={() => onStatus(row, row.status, reply)} className="btn-solid btn-sm ml-auto">
            Save note
          </button>
        </div>
      </div>
    </div>
  );
}

function Info({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded border border-copper/20 bg-charcoal/50 p-3">
      <dt className="text-[10px] uppercase tracking-[0.16em] text-ivory/40">{term}</dt>
      <dd className="mt-1 break-words text-ivory/85">{value}</dd>
    </div>
  );
}
