"use client";

import { useState } from "react";
import { Plus, Pencil } from "lucide-react";
import DataTable from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { PageHeader } from "./OrdersManager";
import { Stat } from "./InventoryManager";
import { money, num } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type SupplierRow = {
  id: string;
  name: string;
  contactName: string;
  phone: string;
  email: string;
  supplies: string;
  leadTimeDays: number;
  outstanding: number;
  notes: string;
  purchaseCount: number;
  isSample: boolean;
};

export default function SuppliersManager({ initial }: { initial: SupplierRow[] }) {
  const { toast } = useSite();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<SupplierRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stats = {
    total: rows.length,
    payable: rows.reduce((s, r) => s + r.outstanding, 0),
    avgLead: rows.length ? Math.round(rows.reduce((s, r) => s + (r.leadTimeDays || 0), 0) / rows.length) : 0,
  };

  async function refresh() {
    try {
      const res = await fetch("/api/owner/suppliers");
      if (res.ok) setRows(await res.json());
    } catch { /* keep rows */ }
  }

  async function save(data: Record<string, string | number | boolean>) {
    setBusy(true);
    setError("");
    try {
      const body = {
        ...(editing ? { id: editing.id } : {}),
        name: data.name,
        contactName: data.contactName,
        phone: data.phone,
        email: data.email,
        supplies: data.supplies,
        leadTimeDays: data.leadTimeDays === "" ? undefined : Number(data.leadTimeDays),
        outstanding: data.outstanding === "" ? undefined : Number(data.outstanding),
        notes: data.notes,
      };
      const res = await fetch("/api/owner/suppliers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not save the supplier.");
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
    { name: "name", label: "Supplier name", type: "text", required: true, placeholder: "Surat Mills Co." },
    { name: "contactName", label: "Contact person", type: "text", placeholder: "Nilesh Patel" },
    { name: "phone", label: "Phone", type: "tel", placeholder: "+91 98XXXXXXXX" },
    { name: "email", label: "Email", type: "email" },
    {
      name: "supplies",
      label: "Supplies",
      type: "select",
      options: ["Fabric", "Trims & Accessories", "Packaging", "Machines & Spares", "Dyeing & Processing", "Other"].map((v) => ({ value: v, label: v })),
    },
    { name: "leadTimeDays", label: "Lead time (days)", type: "number", placeholder: "7" },
    { name: "outstanding", label: "Amount payable (₹)", type: "number", placeholder: "0" },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Payment terms, quality notes, minimum order…" },
  ];

  return (
    <>
      <PageHeader title="Suppliers" subtitle="Fabric, trims and service partners behind every garment." count={rows.length}>
        <button type="button" onClick={() => setCreating(true)} className="btn-solid btn-sm">
          <Plus size={14} /> Add Supplier
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <Stat label="Suppliers" value={num(stats.total)} />
        <Stat label="Total payable" value={money(stats.payable)} tone={stats.payable > 0 ? "text-danger" : "text-ok"} />
        <Stat label="Average lead time" value={`${stats.avgLead} days`} />
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyText="No suppliers recorded yet. Add the mills and trim vendors you buy from."
        columns={[
          { key: "name", header: "Supplier", render: (r) => <span className="text-ivory/88">{r.name}</span>, search: (r) => `${r.name} ${r.contactName} ${r.supplies} ${r.phone}` },
          { key: "supplies", header: "Supplies", render: (r) => <span className="text-champagne/85">{r.supplies || "—"}</span> },
          { key: "contactName", header: "Contact", render: (r) => <span className="text-ivory/60">{r.contactName || "—"}</span> },
          { key: "phone", header: "Phone", render: (r) => <span className="whitespace-nowrap text-ivory/60">{r.phone || "—"}</span> },
          { key: "leadTimeDays", header: "Lead time", render: (r) => <span className="tabular-nums text-ivory/70">{r.leadTimeDays ? `${r.leadTimeDays} d` : "—"}</span>, search: (r) => String(r.leadTimeDays) },
          { key: "purchaseCount", header: "Purchases", render: (r) => <span className="tabular-nums">{num(r.purchaseCount)}</span>, search: (r) => String(r.purchaseCount) },
          { key: "outstanding", header: "Payable", render: (r) => <span className={`whitespace-nowrap tabular-nums ${r.outstanding > 0 ? "text-danger" : "text-ok"}`}>{r.outstanding > 0 ? money(r.outstanding) : "Settled"}</span>, search: (r) => String(r.outstanding) },
        ]}
        actions={(r) => (
          <button type="button" onClick={() => setEditing(r)} aria-label={`Edit ${r.name}`} className="grid h-8 w-8 place-items-center rounded border border-copper/30 text-champagne hover:bg-espresso">
            <Pencil size={13} />
          </button>
        )}
      />

      {(creating || editing) && (
        <FormModal
          title={editing ? `Edit — ${editing.name}` : "Add Supplier"}
          fields={fields}
          values={
            editing
              ? { name: editing.name, contactName: editing.contactName, phone: editing.phone, email: editing.email, supplies: editing.supplies || "Fabric", leadTimeDays: editing.leadTimeDays || "", outstanding: editing.outstanding || "", notes: editing.notes }
              : undefined
          }
          busy={busy}
          error={error}
          submitLabel={editing ? "Save changes" : "Add supplier"}
          onSubmit={save}
          onClose={() => { setCreating(false); setEditing(null); setError(""); }}
        />
      )}
    </>
  );
}
