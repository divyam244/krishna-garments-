"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import DataTable from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { PageHeader } from "./OrdersManager";
import { Stat } from "./InventoryManager";
import { money, num, date as fmtDate } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type CustomerRow = {
  id: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  city: string;
  gstin: string;
  type: string;
  notes: string;
  orderCount: number;
  lifetimeValue: number;
  outstanding: number;
  isSample: boolean;
  createdAt: string;
};

const TYPE_MAP: Record<string, { label: string; tone: string }> = {
  RETAIL: { label: "Retail", tone: "border-ivory/25 text-ivory/60" },
  WHOLESALE: { label: "Wholesale", tone: "border-copper/50 bg-copper/12 text-champagne" },
  BULK: { label: "Bulk buyer", tone: "border-ok/50 bg-ok/12 text-ok" },
};

export default function CustomersManager({ initial }: { initial: CustomerRow[] }) {
  const { toast } = useSite();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<CustomerRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stats = {
    total: rows.length,
    wholesale: rows.filter((r) => r.type !== "RETAIL").length,
    revenue: rows.reduce((s, r) => s + r.lifetimeValue, 0),
    due: rows.reduce((s, r) => s + r.outstanding, 0),
  };

  async function refresh() {
    try {
      const res = await fetch("/api/owner/customers");
      if (res.ok) setRows(await res.json());
    } catch { /* keep rows */ }
  }

  async function save(data: Record<string, string | number | boolean>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/owner/customers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...(editing ? { id: editing.id } : {}), ...data }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save the customer.");
      toast(editing ? `${data.name} updated` : `${data.name} added`, "success");
      setEditing(null);
      setCreating(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const fields: Field[] = [
    { name: "name", label: "Contact name", type: "text", required: true, placeholder: "Priya Sharma" },
    { name: "company", label: "Business name", type: "text", placeholder: "StyleHub Delhi" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98XXXXXXXX" },
    { name: "email", label: "Email", type: "email", placeholder: "buyer@business.com" },
    { name: "city", label: "City", type: "text", placeholder: "Mumbai" },
    { name: "gstin", label: "GSTIN", type: "text", placeholder: "27ABCDE1234F1Z5" },
    { name: "type", label: "Customer type", type: "select", options: Object.entries(TYPE_MAP).map(([value, v]) => ({ value, label: v.label })) },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Preferred sizes, payment behaviour, repeat styles…" },
  ];

  return (
    <>
      <PageHeader title="Customers" subtitle="Retail buyers and wholesale accounts." count={rows.length}>
        <button type="button" onClick={() => setCreating(true)} className="btn-solid btn-sm">
          <Plus size={14} /> Add Customer
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Customers" value={num(stats.total)} />
        <Stat label="Trade accounts" value={num(stats.wholesale)} />
        <Stat label="Lifetime revenue" value={money(stats.revenue)} />
        <Stat label="Total outstanding" value={money(stats.due)} tone={stats.due > 0 ? "text-danger" : "text-ok"} />
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyText="No customers recorded. Add one, or they arrive automatically from enquiries you convert."
        pageSize={15}
        columns={[
          { key: "name", header: "Name", render: (r) => <span className="text-ivory/88">{r.name}</span>, search: (r) => `${r.name} ${r.company} ${r.phone} ${r.email}` },
          { key: "company", header: "Business", render: (r) => <span className="text-ivory/65">{r.company || "—"}</span> },
          { key: "type", header: "Type", render: (r) => <span className={`rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${TYPE_MAP[r.type]?.tone ?? ""}`}>{TYPE_MAP[r.type]?.label ?? r.type}</span> },
          { key: "phone", header: "Phone", render: (r) => <span className="whitespace-nowrap text-ivory/60">{r.phone || "—"}</span> },
          { key: "city", header: "City", render: (r) => <span className="text-ivory/60">{r.city || "—"}</span> },
          { key: "orderCount", header: "Orders", render: (r) => <span className="tabular-nums">{num(r.orderCount)}</span>, search: (r) => String(r.orderCount) },
          { key: "lifetimeValue", header: "Lifetime value", render: (r) => <span className="whitespace-nowrap tabular-nums text-champagne">{money(r.lifetimeValue)}</span>, search: (r) => String(r.lifetimeValue) },
          { key: "outstanding", header: "Outstanding", render: (r) => <span className={`whitespace-nowrap tabular-nums ${r.outstanding > 0 ? "text-danger" : "text-ok"}`}>{r.outstanding > 0 ? money(r.outstanding) : "Clear"}</span>, search: (r) => String(r.outstanding) },
        ]}
        actions={(r) => (
          <button type="button" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`} className="grid h-8 w-8 place-items-center rounded border border-copper/30 text-champagne hover:bg-espresso">
            <Pencil size={13} />
          </button>
        )}
      />

      {(creating || editing) && (
        <FormModal
          title={editing ? `Edit — ${editing.name}` : "Add Customer"}
          fields={fields}
          values={
            editing
              ? { name: editing.name, company: editing.company, phone: editing.phone, email: editing.email, city: editing.city, gstin: editing.gstin, type: editing.type, notes: editing.notes }
              : undefined
          }
          busy={busy}
          error={error}
          submitLabel={editing ? "Save changes" : "Add customer"}
          onSubmit={save}
          onClose={() => { setCreating(false); setEditing(null); setError(""); }}
        />
      )}
    </>
  );
}
