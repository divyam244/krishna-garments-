"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Loader2 } from "lucide-react";
import DataTable, { StatusPill } from "@/components/owner/DataTable";
import FormModal, { type Field } from "@/components/owner/FormModal";
import { PageHeader } from "./OrdersManager";
import { Stat } from "./InventoryManager";
import { num, date as fmtDate } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type BatchRow = {
  id: string;
  batchNo: string;
  productName: string;
  stage: string;
  progressPct: number;
  completedQty: number;
  targetQty: number;
  inCharge: string;
  startDate: string;
  expectedDate: string | null;
  notes: string;
  isSample: boolean;
};

const STAGES = ["CUTTING", "STITCHING", "FINISHING", "QUALITY_CHECK", "PACKAGING", "COMPLETE"] as const;

const STAGE_MAP: Record<string, { label: string; tone: string }> = {
  CUTTING: { label: "Cutting", tone: "border-danger/50 bg-danger/12 text-danger" },
  STITCHING: { label: "Stitching", tone: "border-warn/50 bg-warn/12 text-warn" },
  FINISHING: { label: "Finishing", tone: "border-copper/50 bg-copper/12 text-champagne" },
  QUALITY_CHECK: { label: "Quality check", tone: "border-[#9B7BB8]/50 bg-[#9B7BB8]/12 text-[#C4A6DC]" },
  PACKAGING: { label: "Packaging", tone: "border-champagne/50 bg-champagne/12 text-champagne" },
  COMPLETE: { label: "Complete", tone: "border-ok/50 bg-ok/12 text-ok" },
};

export default function ProductionManager({ initial }: { initial: BatchRow[] }) {
  const { toast } = useSite();
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<BatchRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const stats = useMemo(() => {
    const open = rows.filter((r) => r.stage !== "COMPLETE");
    return {
      open: open.length,
      unitsInProcess: open.reduce((s, r) => s + (r.targetQty - r.completedQty), 0),
      completed: rows.filter((r) => r.stage === "COMPLETE").length,
      avgProgress: open.length ? Math.round(open.reduce((s, r) => s + r.progressPct, 0) / open.length) : 0,
    };
  }, [rows]);

  async function refresh() {
    try {
      const res = await fetch("/api/owner/batches");
      if (res.ok) setRows(await res.json());
    } catch { /* keep rows */ }
  }

  async function create(data: Record<string, string | number | boolean>) {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/owner/batches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productName: data.productName,
          targetQty: Number(data.targetQty || 1),
          inCharge: data.inCharge,
          expectedDate: data.expectedDate ? String(data.expectedDate) : "",
          notes: data.notes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not start the batch.");
      toast(`Batch ${json.batchNo} started`, "success");
      setCreating(false);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function update(data: Record<string, string | number | boolean>) {
    if (!editing) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(`/api/owner/batches/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: data.stage,
          completedQty: Number(data.completedQty || 0),
          targetQty: Number(data.targetQty || 1),
          inCharge: data.inCharge,
          notes: data.notes,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Could not update the batch.");
      toast(`Batch ${editing.batchNo}: ${json.progressPct}% · ${STAGE_MAP[json.stage]?.label ?? json.stage}`, "success");
      setEditing(null);
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const createFields: Field[] = [
    { name: "productName", label: "Style being produced", type: "text", required: true, placeholder: "Women Jacket" },
    { name: "targetQty", label: "Target quantity", type: "number", required: true, placeholder: "1200" },
    { name: "inCharge", label: "Line in charge", type: "text", placeholder: "Ramesh — Cutting floor" },
    { name: "expectedDate", label: "Expected completion", type: "date" },
    { name: "notes", label: "Notes", type: "textarea", placeholder: "Fabric lot reference, buyer deadline, special finishing…" },
  ];

  const editFields: Field[] = [
    {
      name: "stage",
      label: "Current stage",
      type: "select",
      options: STAGES.map((s) => ({ value: s, label: STAGE_MAP[s].label })),
    },
    { name: "targetQty", label: "Target quantity", type: "number", required: true },
    { name: "completedQty", label: "Completed so far", type: "number", required: true, help: "Progress percentage is calculated from this." },
    { name: "inCharge", label: "Line in charge", type: "text" },
    { name: "notes", label: "Notes", type: "textarea" },
  ];

  return (
    <>
      <PageHeader title="Production" subtitle="Batch tracking from cutting through packaging." count={rows.length}>
        <button type="button" onClick={() => setCreating(true)} className="btn-solid btn-sm">
          <Plus size={14} /> Start Production
        </button>
      </PageHeader>

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Open batches" value={num(stats.open)} />
        <Stat label="Units in process" value={num(stats.unitsInProcess)} />
        <Stat label="Average progress" value={`${stats.avgProgress}%`} />
        <Stat label="Batches complete" value={num(stats.completed)} tone="text-ok" />
      </div>

      <DataTable
        rows={rows}
        rowKey={(r) => r.id}
        emptyText="No production batches yet. Start one to begin tracking a run."
        columns={[
          { key: "batchNo", header: "Batch", render: (r) => <span className="whitespace-nowrap text-champagne">#{r.batchNo}</span> },
          { key: "productName", header: "Style", search: (r) => `${r.productName} ${r.batchNo} ${r.inCharge}` },
          { key: "stage", header: "Stage", render: (r) => <StatusPill value={r.stage} map={STAGE_MAP} /> },
          {
            key: "progressPct",
            header: "Progress",
            render: (r) => (
              <div className="flex min-w-[150px] items-center gap-3">
                <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-charcoal">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-copper to-champagne"
                    style={{ width: `${r.progressPct}%` }}
                  />
                </span>
                <span className="w-9 shrink-0 text-right tabular-nums text-[12px] text-champagne">{r.progressPct}%</span>
              </div>
            ),
            search: (r) => String(r.progressPct),
          },
          { key: "completedQty", header: "Units", render: (r) => <span className="whitespace-nowrap tabular-nums text-ivory/70">{num(r.completedQty)} / {num(r.targetQty)}</span>, search: (r) => String(r.completedQty) },
          { key: "inCharge", header: "In charge", render: (r) => <span className="text-ivory/60">{r.inCharge || "—"}</span> },
          { key: "expectedDate", header: "Expected", render: (r) => <span className="whitespace-nowrap text-ivory/55">{fmtDate(r.expectedDate)}</span>, search: (r) => r.expectedDate ?? "" },
        ]}
        actions={(r) => (
          <button type="button" onClick={() => setEditing(r)} aria-label={`Update batch ${r.batchNo}`} className="grid h-8 w-8 place-items-center rounded border border-copper/30 text-champagne hover:bg-espresso">
            <Pencil size={13} />
          </button>
        )}
      />

      {creating && (
        <FormModal title="Start Production Batch" fields={createFields} busy={busy} error={error} submitLabel="Start batch" onSubmit={create} onClose={() => { setCreating(false); setError(""); }} />
      )}

      {editing && (
        <FormModal
          title={`Batch #${editing.batchNo}`}
          fields={editFields}
          values={{
            stage: editing.stage,
            targetQty: editing.targetQty,
            completedQty: editing.completedQty,
            inCharge: editing.inCharge,
            notes: editing.notes,
          }}
          busy={busy}
          error={error}
          submitLabel="Update progress"
          onSubmit={update}
          onClose={() => { setEditing(null); setError(""); }}
        />
      )}
    </>
  );
}

/** Compact inline stage updater used on the dashboard later. */
export function StageButton({ stage, onDone }: { stage: string; onDone: () => void }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" disabled={busy} onClick={async () => { setBusy(true); onDone(); setBusy(false); }} className="btn-ghost btn-sm">
      {busy ? <Loader2 size={13} className="animate-spin" /> : null}
      {STAGE_MAP[stage]?.label ?? stage}
    </button>
  );
}
