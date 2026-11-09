"use client";

import { useEffect, useRef } from "react";
import type { DashboardData } from "@/lib/owner/dashboard";

/** Order Status donut, drawn on canvas with the reference's segment palette. */
export default function OrderStatusDonut({ data }: { data: DashboardData }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const draw = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = 200;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2;
      const cy = size / 2;
      const rOuter = size / 2 - 6;
      const thickness = 26;

      let start = -Math.PI / 2;
      const totalPct = data.statusSplit.reduce((s, x) => s + x.pct, 0) || 100;

      for (const seg of data.statusSplit) {
        const sweep = (seg.pct / totalPct) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, rOuter, start, start + sweep);
        ctx.arc(cx, cy, rOuter - thickness, start + sweep, start, true);
        ctx.closePath();
        ctx.fillStyle = seg.colour;
        ctx.fill();
        start += sweep;
      }

      // Inner disc
      ctx.beginPath();
      ctx.arc(cx, cy, rOuter - thickness - 4, 0, Math.PI * 2);
      ctx.fillStyle = "#1D1916";
      ctx.fill();
      ctx.strokeStyle = "rgba(184,115,51,.3)";
      ctx.lineWidth = 1;
      ctx.stroke();
    };

    draw();
  }, [data]);

  return (
    <div className="card flex h-full flex-col p-5 md:p-6">
      <header className="mb-5 flex items-center gap-2.5">
        <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B87333" strokeWidth="1.6" aria-hidden>
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4v8l5 4" strokeLinecap="round" />
        </svg>
        <h2 className="font-display text-[21px]">Order Status</h2>
      </header>

      <div className="flex flex-1 flex-col items-center gap-6 sm:flex-row sm:items-center sm:gap-8">
        <div className="relative shrink-0">
          <canvas ref={canvasRef} role="img" aria-label={`Order status distribution across ${data.totals.orderCount} orders`} />
          <span className="pointer-events-none absolute inset-0 grid place-content-center text-center">
            <span className="font-display text-[30px] leading-none text-ivory">{data.totals.orderCount}</span>
            <span className="mt-1 text-[11px] uppercase tracking-[0.2em] text-ivory/45">Orders</span>
          </span>
        </div>

        <ul className="flex w-full flex-col gap-3">
          {data.statusSplit.map((s) => (
            <li key={s.label} className="flex items-center gap-3 text-[13.5px]">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.colour }} />
              <span className="flex-1 text-ivory/72">{s.label}</span>
              <span className="tabular-nums text-champagne">{s.pct}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
