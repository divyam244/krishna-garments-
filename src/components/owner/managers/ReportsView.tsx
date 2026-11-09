"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "./OrdersManager";
import { compactMoney, money, num } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

export type ReportData = {
  range: { days: number; label: string };
  revenue: number;
  collected: number;
  outstanding: number;
  orders: number;
  averageOrderValue: number;
  unitsSold: number;
  byCategory: { name: string; value: number; units: number }[];
  byStatus: { label: string; count: number; colour: string }[];
  monthly: { label: string; value: number }[];
};

const RANGES = [7, 30, 90, 365];

export default function ReportsView({ data }: { data: ReportData }) {
  const { toast } = useSite();
  const [tab, setTab] = useState<"categories" | "monthly">("categories");

  const maxCategory = Math.max(...data.byCategory.map((c) => c.value), 1);

  const csv = useMemo(() => {
    const lines = [
      ["Krishna Garments — business report", data.range.label],
      [],
      ["Metric", "Value"],
      ["Revenue", Math.round(data.revenue)],
      ["Collected", Math.round(data.collected)],
      ["Outstanding", Math.round(data.outstanding)],
      ["Orders", data.orders],
      ["Average order value", Math.round(data.averageOrderValue)],
      ["Units sold", data.unitsSold],
      [],
      ["Category", "Revenue", "Units"],
      ...data.byCategory.map((c) => [c.name, Math.round(c.value), c.units]),
    ];
    return lines.map((r) => r.map((v) => (typeof v === "string" ? `"${v.replace(/"/g, '""')}"` : String(v))).join(",")).join("\n");
  }, [data]);

  function exportCsv() {
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `krishna-garments-report-${data.range.days}d.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Report downloaded as CSV", "success");
  }

  return (
    <>
      <PageHeader title="Reports" subtitle="Business performance over the selected window." >
        <button type="button" onClick={exportCsv} className="btn-solid btn-sm">
          <Download size={14} /> Export CSV
        </button>
      </PageHeader>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Big label="Revenue" value={money(Math.round(data.revenue))} note={data.range.label} />
        <Big label="Collected" value={money(Math.round(data.collected))} tone="text-ok" note={`${Math.round((data.collected / Math.max(data.revenue, 1)) * 100)}% of billed`} />
        <Big label="Outstanding" value={money(Math.round(data.outstanding))} tone={data.outstanding > 0 ? "text-danger" : "text-ok"} note="Awaiting payment" />
        <Big label="Orders" value={num(data.orders)} note={`${data.range.label} window`} />
        <Big label="Average order value" value={compactMoney(data.averageOrderValue)} note="Per order" />
        <Big label="Units sold" value={num(data.unitsSold)} note="Across all styles" />
      </div>

      {/* Category breakdown */}
      <section className="card p-6">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-[22px]">Performance by category</h2>
          <div className="flex gap-1.5">
            {(["categories", "monthly"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-full border px-3 py-1.5 text-[10.5px] uppercase tracking-[0.14em] transition-colors ${
                  tab === t ? "border-copper bg-copper/15 text-champagne" : "border-ivory/18 text-ivory/50 hover:border-copper/50"
                }`}
              >
                {t === "categories" ? "By category" : "Month to month"}
              </button>
            ))}
          </div>
        </header>

        {tab === "categories" ? (
          data.byCategory.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ivory/45">No sales recorded in this window.</p>
          ) : (
            <ul className="flex flex-col gap-3.5">
              {data.byCategory.map((c) => (
                <li key={c.name}>
                  <div className="mb-1.5 flex items-baseline justify-between gap-4 text-[13px]">
                    <span className="truncate text-ivory/80">{c.name}</span>
                    <span className="shrink-0 tabular-nums text-champagne">
                      {money(Math.round(c.value))} <span className="text-[11px] text-ivory/40">· {num(c.units)} pcs</span>
                    </span>
                  </div>
                  <span className="block h-2 overflow-hidden rounded-full bg-charcoal">
                    <span
                      className="block h-full rounded-full bg-gradient-to-r from-copper to-champagne transition-[width] duration-700"
                      style={{ width: `${(c.value / maxCategory) * 100}%` }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )
        ) : (
          <MonthlyBars months={data.monthly} />
        )}
      </section>

      {/* Status distribution */}
      <section className="card mt-5 p-6">
        <h2 className="mb-5 font-display text-[22px]">Order pipeline</h2>
        <ul className="flex flex-wrap gap-x-8 gap-y-4">
          {data.byStatus.map((s) => (
            <li key={s.label} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ background: s.colour }} />
              <span className="text-[13.5px] text-ivory/75">{s.label}</span>
              <span className="tabular-nums text-champagne">{num(s.count)}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}

function MonthlyBars({ months }: { months: { label: string; value: number }[] }) {
  if (months.length === 0) return <p className="py-8 text-center text-[13px] text-ivory/45">No history yet.</p>;
  const max = Math.max(...months.map((m) => m.value), 1);
  return (
    <div className="flex h-52 items-end gap-3 overflow-x-auto pb-2">
      {months.map((m) => (
        <div key={m.label} className="flex min-w-[54px] flex-1 flex-col items-center gap-2">
          <span className="text-[10.5px] tabular-nums text-champagne/80">{compactMoney(m.value)}</span>
          <span
            className="w-full rounded-t bg-gradient-to-t from-copper/70 to-champagne transition-all duration-700 hover:from-copper hover:to-ivory"
            style={{ height: `${Math.max(4, (m.value / max) * 150)}px` }}
          />
          <span className="whitespace-nowrap text-[10.5px] uppercase tracking-[0.12em] text-ivory/45">{m.label}</span>
        </div>
      ))}
    </div>
  );
}

function Big({ label, value, note, tone = "text-champagne" }: { label: string; value: string; note?: string; tone?: string }) {
  return (
    <div className="sheen relative overflow-hidden rounded-xl border border-copper/25 bg-gradient-to-br from-espresso/70 via-deep to-charcoal p-5">
      <p className="text-[11px] uppercase tracking-[0.18em] text-ivory/45">{label}</p>
      <p className={`mt-2 font-display text-[30px] leading-none ${tone}`}>{value}</p>
      {note && <p className="mt-2 text-[11.5px] text-ivory/40">{note}</p>}
    </div>
  );
}
