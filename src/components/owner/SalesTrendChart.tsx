"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DashboardData } from "@/lib/owner/dashboard";
import { compactMoney } from "@/lib/format";

/**
 * Sales Trend — canvas line chart with copper gradient fill, matching the
 * reference dashboard. Drawn on canvas (not an SVG lib) to keep the bundle lean
 * and to control the glow exactly.
 */
export default function SalesTrendChart({ data }: { data: DashboardData["salesTrend"] }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const points = useMemo(() => data.map((d) => d.value), [data]);
  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);

  useEffect(() => {
    let raf = 0;
    const draw = () => {
      const canvas = canvasRef.current;
      const wrap = wrapRef.current;
      if (!canvas || !wrap) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const padL = 46;
      const padR = 14;
      const padT = 14;
      const padB = 30;
      const innerW = w - padL - padR;
      const innerH = h - padT - padB;

      // Y scale rounded up to a friendly step.
      const niceMax = niceCeil(max);
      const yFor = (v: number) => padT + innerH - (v / niceMax) * innerH;
      const xFor = (i: number) => padL + (i / Math.max(points.length - 1, 1)) * innerW;

      // Gridlines + axis labels
      ctx.font = "10px Jost, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      for (let g = 0; g <= 4; g++) {
        const v = (niceMax / 4) * g;
        const y = yFor(v);
        ctx.strokeStyle = "rgba(233,217,197,.07)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padL, y);
        ctx.lineTo(w - padR, y);
        ctx.stroke();
        ctx.fillStyle = "rgba(233,217,197,.42)";
        ctx.textAlign = "right";
        ctx.fillText(shortAxis(v), padL - 8, y);
      }

      // X labels: ~5 evenly spaced dates
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(233,217,197,.42)";
      const ticks = 5;
      for (let t = 0; t < ticks; t++) {
        const i = Math.round((t / (ticks - 1)) * (points.length - 1));
        const label = new Date(data[i]?.date ?? Date.now()).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
        });
        ctx.fillText(label, xFor(i), h - padB + 14);
      }

      if (points.length < 2) return;

      // Area fill
      const grad = ctx.createLinearGradient(0, padT, 0, padT + innerH);
      grad.addColorStop(0, "rgba(212,154,96,.42)");
      grad.addColorStop(1, "rgba(184,115,51,.02)");

      ctx.beginPath();
      ctx.moveTo(xFor(0), yFor(points[0]));
      for (let i = 1; i < points.length; i++) smooth(ctx, points, i, xFor, yFor);
      ctx.lineTo(xFor(points.length - 1), padT + innerH);
      ctx.lineTo(xFor(0), padT + innerH);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Line with glow
      ctx.beginPath();
      ctx.moveTo(xFor(0), yFor(points[0]));
      for (let i = 1; i < points.length; i++) smooth(ctx, points, i, xFor, yFor);
      ctx.strokeStyle = "#D49A60";
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "rgba(212,154,96,.55)";
      ctx.shadowBlur = 12;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Hover marker
      if (hover != null && points[hover] != null) {
        const hx = xFor(hover);
        const hy = yFor(points[hover]);
        ctx.strokeStyle = "rgba(233,217,197,.28)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(hx, padT);
        ctx.lineTo(hx, padT + innerH);
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(hx, hy, 5, 0, Math.PI * 2);
        ctx.fillStyle = "#E9D9C5";
        ctx.fill();
        ctx.strokeStyle = "#B87333";
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Endpoint dot like the reference
        const lx = xFor(points.length - 1);
        const ly = yFor(points[points.length - 1]);
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = "#D49A60";
        ctx.fill();
      }
    };

    draw();
    const ro = new ResizeObserver(() => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(draw);
    });
    if (wrapRef.current) ro.observe(wrapRef.current);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [points, data, hover, max, min]);

  // Map pointer position -> index
  const onMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const padL = 46;
    const padR = 14;
    const innerW = rect.width - padL - padR;
    const rel = (e.clientX - rect.left - padL) / innerW;
    const idx = Math.round(rel * (points.length - 1));
    if (idx >= 0 && idx < points.length) setHover(idx);
  };

  const hoveredPoint = hover != null ? data[hover] : null;

  return (
    <div className="card relative flex h-full flex-col p-5 md:p-6">
      <header className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-[21px]">
          <TrendGlyph /> Sales Trend
        </h2>
        <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/40">Last 30 days</p>
      </header>

      <div ref={wrapRef} className="relative h-[230px] w-full flex-1" onMouseMove={onMove} onMouseLeave={() => setHover(null)}>
        <canvas ref={canvasRef} className="block h-full w-full" role="img" aria-label="Sales trend over the last 30 days" />

        {hoveredPoint && (
          <span className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 rounded border border-copper/45 bg-charcoal/95 px-3 py-1.5 text-[11px] text-champagne shadow-card">
            {new Date(hoveredPoint.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })} ·{" "}
            {compactMoney(hoveredPoint.value)}
          </span>
        )}
      </div>
    </div>
  );
}

// -------------------------------------------------------------------- utils --

/** Catmull-Rom-ish smoothing between point i-1 and i using midpoint quadratics. */
function smooth(
  ctx: CanvasRenderingContext2D,
  pts: number[],
  i: number,
  xFor: (n: number) => number,
  yFor: (n: number) => number,
) {
  const xc = (xFor(i - 1) + xFor(i)) / 2;
  const yc = (yFor(pts[i - 1]) + yFor(pts[i])) / 2;
  ctx.quadraticCurveTo(xFor(i - 1), yFor(pts[i - 1]), xc, yc);
  if (i === pts.length - 1) ctx.quadraticCurveTo(xc, yc, xFor(i), yFor(pts[i]));
}

function niceCeil(v: number): number {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  return Math.ceil(v / mag) * mag;
}

function shortAxis(v: number): string {
  if (v >= 1_00_00_000) return `${(v / 1_00_00_000).toFixed(1)}Cr`;
  if (v >= 1_00_000) return `${Math.round(v / 1_00_000)}L`;
  if (v >= 1_000) return `${Math.round(v / 1_000)}K`;
  return String(Math.round(v));
}

function TrendGlyph() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#B87333" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}
