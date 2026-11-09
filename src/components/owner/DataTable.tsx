"use client";

import { useState } from "react";
import { Search, X, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  className?: string;
  /** Field name used for text search when no custom `searchValue`. */
  search?: (row: T) => string;
};

type Props<T> = {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  emptyText: string;
  searchable?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  actions?: (row: T) => React.ReactNode;
  initialFilter?: string;
};

/** Generic owner table: search, sort, pagination, responsive card fallback. */
export default function DataTable<T>({
  rows,
  columns,
  rowKey,
  emptyText,
  searchable = true,
  pageSize = 12,
  onRowClick,
  actions,
}: Props<T>) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const needle = q.trim().toLowerCase();
  const filtered = needle
    ? rows.filter((r) =>
        columns.some((c) => {
          const value = c.search ? c.search(r) : String((r as Record<string, unknown>)[c.key] ?? "");
          return value.toLowerCase().includes(needle);
        }),
      )
    : rows;

  const sorted = sort
    ? [...filtered].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sort.key];
        const bv = (b as Record<string, unknown>)[sort.key];
        const an = typeof av === "number" ? av : String(av ?? "").toLowerCase();
        const bn = typeof bv === "number" ? bv : String(bv ?? "").toLowerCase();
        return (an < bn ? -1 : an > bn ? 1 : 0) * sort.dir;
      })
    : filtered;

  const pageCount = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pageCount - 1);
  const slice = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (key: string) =>
    setSort((s) => (s?.key === key ? (s.dir === 1 ? { key, dir: -1 } : null) : { key, dir: 1 }));

  return (
    <div className="card overflow-hidden">
      {searchable && (
        <div className="flex flex-wrap items-center gap-3 border-b border-copper/20 p-4">
          <span className="relative flex-1 min-w-[200px]">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-champagne/60" />
            <input
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="Search this table…"
              aria-label="Search records"
              className="field pl-9"
            />
            {q && (
              <button type="button" onClick={() => setQ("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 text-ivory/40 hover:text-champagne">
                <X size={14} />
              </button>
            )}
          </span>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">
            {sorted.length} record{sorted.length === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-copper/20 bg-espresso/40">
              {columns.map((c) => (
                <th key={c.key} scope="col" className={`px-4 py-3 font-medium ${c.className ?? ""}`}>
                  <button
                    type="button"
                    onClick={() => toggleSort(c.key)}
                    className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[0.18em] text-champagne/75 hover:text-champagne"
                  >
                    {c.header}
                    {sort?.key === c.key && <span aria-hidden>{sort.dir === 1 ? "▲" : "▼"}</span>}
                  </button>
                </th>
              ))}
              {actions && <th scope="col" className="px-4 py-3 text-right"><span className="text-[10.5px] uppercase tracking-[0.18em] text-champagne/75">Actions</span></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-copper/12">
            {slice.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={`transition-colors hover:bg-espresso/35 ${onRowClick ? "cursor-pointer" : ""}`}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 align-middle text-ivory/78 ${c.className ?? ""}`}>
                    {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                  </td>
                ))}
                {actions && <td className="px-4 py-3 text-right">{actions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <ul className="divide-y divide-copper/12 md:hidden">
        {slice.map((row) => (
          <li key={rowKey(row)} className="flex flex-col gap-2 p-4">
            {columns.map((c) => (
              <div key={c.key} className="flex items-start justify-between gap-4">
                <span className="shrink-0 text-[10px] uppercase tracking-[0.16em] text-ivory/40">{c.header}</span>
                <span className="min-w-0 text-right text-[13px] text-ivory/82">
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? "—")}
                </span>
              </div>
            ))}
            {actions && <div className="pt-1">{actions(row)}</div>}
          </li>
        ))}
      </ul>

      {sorted.length === 0 && (
        <p className="py-14 text-center text-[13px] text-ivory/40">{emptyText}</p>
      )}

      {pageCount > 1 && (
        <nav className="flex items-center justify-between gap-4 border-t border-copper/20 px-4 py-3" aria-label="Table pages">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={safePage === 0}
            className="btn-ghost btn-sm disabled:opacity-30"
          >
            <ChevronLeft size={14} /> Prev
          </button>
          <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/45">
            Page {safePage + 1} of {pageCount}
          </p>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            disabled={safePage >= pageCount - 1}
            className="btn-ghost btn-sm disabled:opacity-30"
          >
            Next <ChevronRight size={14} />
          </button>
        </nav>
      )}
    </div>
  );
}

export function StatusPill({ value, map }: { value: string; map: Record<string, { label: string; tone: string }> }) {
  const entry = map[value] ?? { label: value, tone: "text-ivory/60 border-ivory/25" };
  return (
    <span className={`inline-block whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10.5px] uppercase tracking-[0.12em] ${entry.tone}`}>
      {entry.label}
    </span>
  );
}

export function useBusy() {
  const [busy, setBusy] = useState(false);
  return { busy, run: async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } } };
}
