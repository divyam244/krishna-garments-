"use client";

import { useState } from "react";
import { Truck, Loader2, Search } from "lucide-react";

/** Public order lookup by order number. Reads /api/orders/track. */
export default function TrackOrder() {
  const [no, setNo] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "found" | "miss">("idle");
  const [data, setData] = useState<{ orderNo: string; status: string; total: number; items: string[]; createdAt: string } | null>(null);

  async function track(e: React.FormEvent) {
    e.preventDefault();
    if (!no.trim()) return;
    setState("loading");
    try {
      const res = await fetch(`/api/orders/track?orderNo=${encodeURIComponent(no.trim())}`);
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setData(null);
        setState("miss");
        return;
      }
      setData(json);
      setState("found");
    } catch {
      setState("miss");
    }
  }

  return (
    <section className="card p-7" aria-labelledby="track-title">
      <h2 id="track-title" className="mb-4 flex items-center gap-3 font-display text-[22px]">
        <Truck size={18} className="text-copper" /> Track an order
      </h2>

      <form onSubmit={track} className="flex gap-2">
        <input
          value={no}
          onChange={(e) => {
            setNo(e.target.value);
            if (state !== "idle") setState("idle");
          }}
          placeholder="KG-2026-123456"
          aria-label="Order number"
          className="field"
        />
        <button type="submit" disabled={state === "loading"} aria-label="Look up order" className="grid h-[46px] w-[46px] shrink-0 place-items-center rounded-sm bg-gradient-to-br from-copper to-champagne text-charcoal hover:brightness-110 disabled:opacity-60">
          {state === "loading" ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
        </button>
      </form>

      {state === "found" && data && (
        <dl className="mt-5 flex flex-col gap-2 rounded border border-copper/25 bg-charcoal/50 p-4 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-ivory/45">Order</dt>
            <dd className="text-champagne">{data.orderNo}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ivory/45">Status</dt>
            <dd className="uppercase tracking-wider text-ivory/90">{data.status.replace(/_/g, " ")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ivory/45">Placed</dt>
            <dd>{new Date(data.createdAt).toLocaleDateString("en-IN")}</dd>
          </div>
          <div className="hairline my-1" />
          <dd className="text-ivory/60">{data.items.join(", ")}</dd>
        </dl>
      )}

      {state === "miss" && (
        <p className="mt-4 rounded border border-warn/40 bg-warn/8 px-3 py-2.5 text-[12.5px] leading-relaxed text-warn">
          We could not find that order number. Check the reference in your confirmation message, or contact the desk.
        </p>
      )}
    </section>
  );
}
