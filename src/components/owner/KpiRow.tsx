"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData } from "@/lib/owner/dashboard";
import { compactMoney, num } from "@/lib/format";
import CountUp from "./CountUp";

const TILES: {
  key: keyof DashboardData["totals"];
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  format: (n: number) => string;
  changeKey?: "salesChangePct" | "pendingChangePct";
  badge?: string;
}[] = [
  { key: "sales", label: "Total Sales", icon: BagIcon, format: (n) => compactMoney(n), changeKey: "salesChangePct" },
  { key: "pendingPayments", label: "Pending Payments", icon: CoinsIcon, format: (n) => compactMoney(n), changeKey: "pendingChangePct" },
  { key: "stockUnits", label: "Stock (Inventory)", icon: BoxIcon, format: (n) => `${num(n)} Units` },
  { key: "productionUnits", label: "Production", icon: SewIcon, format: (n) => `${num(n)} Units`, badge: "In Progress" },
];

export default function KpiRow({ data }: { data: DashboardData }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {TILES.map((t) => {
        const value = data.totals[t.key];
        const change = t.changeKey ? data.totals[t.changeKey] : undefined;
        return (
          <article
            key={t.key}
            className="sheen relative overflow-hidden rounded-xl border border-copper/30 bg-gradient-to-br from-espresso/85 via-deep to-charcoal p-5 shadow-card transition-all duration-500 hover:border-copper/70 hover:shadow-glow"
          >
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-copper/40 bg-charcoal/50 text-copper">
                <t.icon size={24} strokeWidth={1.4} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] text-ivory/60">{t.label}</p>
                <p className="mt-1 font-display text-[27px] leading-none text-ivory md:text-[30px]">
                  <CountUp value={value} format={t.format} />
                </p>
                {change !== undefined && (
                  <p className={`mt-2 flex items-center gap-1 text-[12px] ${change >= 0 ? "text-ok" : "text-danger"}`}>
                    <span aria-hidden>{change >= 0 ? "↑" : "↓"}</span>
                    {Math.abs(change)}%
                    <span className="text-ivory/35">vs prev 30d</span>
                  </p>
                )}
                {t.badge && (
                  <span className="mt-2 inline-block rounded-full border border-copper/45 bg-espresso px-2.5 py-0.5 text-[10px] uppercase tracking-[0.14em] text-champagne">
                    {t.badge}
                  </span>
                )}
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ icons ---
// Hand-drawn so they match the reference's copper line style at any size.

function BagIcon(p: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 1.4} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8h12l-1 12H7L6 8z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

function CoinsIcon(p: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 1.4}>
      <ellipse cx="12" cy="6" rx="7" ry="2.6" />
      <path d="M5 6v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
      <path d="M5 11v5c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-5" />
    </svg>
  );
}

function BoxIcon(p: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 1.4} strokeLinejoin="round">
      <path d="M12 3 20 7v10l-8 4-8-4V7l8-4z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </svg>
  );
}

function SewIcon(p: { size?: number; strokeWidth?: number }) {
  return (
    <svg width={p.size ?? 24} height={p.size ?? 24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={p.strokeWidth ?? 1.4} strokeLinecap="round">
      <path d="M4 6h14a2 2 0 0 1 2 2v4" />
      <path d="M4 6v9a2 2 0 0 0 2 2h12" />
      <path d="M18 12v5" />
      <circle cx="8" cy="17" r="1.4" />
      <path d="M11 19h6" />
    </svg>
  );
}
