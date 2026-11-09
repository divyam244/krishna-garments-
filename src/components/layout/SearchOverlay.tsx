"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search as SearchIcon, X } from "lucide-react";

type Hit = { slug: string; name: string; category: string; image: string; price: number | null };

/** Client-side search over the catalogue feed (no backend round-trip needed). */
export default function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [all, setAll] = useState<Hit[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (!open || all.length) return;
    let cancelled = false;
    fetch("/api/products")
      .then((r) => r.json())
      .then((data: Hit[]) => {
        if (!cancelled) setAll(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [open, all.length]);

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const hits = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return all
      .filter(
        (h) =>
          h.name.toLowerCase().includes(needle) ||
          h.category.toLowerCase().includes(needle),
      )
      .slice(0, 8);
  }, [q, all]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[85] flex flex-col bg-ink/92 backdrop-blur-md" role="search">
      <div className="mx-auto w-full max-w-3xl px-5 pt-24 md:pt-28">
        <div className="flex items-center gap-3 border-b border-copper/40 pb-3">
          <SearchIcon size={20} className="text-champagne" />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && hits[0]) {
                router.push(`/product/${hits[0].slug}`);
                onClose();
              }
              if (e.key === "Escape") onClose();
            }}
            placeholder="Search jackets, co-ord sets, kurtis…"
            aria-label="Search products"
            className="w-full bg-transparent font-display text-2xl text-ivory outline-none placeholder:text-ivory/28"
          />
          <button type="button" onClick={onClose} aria-label="Close search" className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-copper/35 text-champagne hover:bg-espresso">
            <X size={16} />
          </button>
        </div>

        {q && hits.length === 0 && (
          <p className="mt-8 text-center text-sm text-ivory/50">
            No matches for “{q}”.{" "}
            <Link href="/clothing" onClick={onClose} className="text-champagne underline decoration-copper/50">
              Browse all clothing
            </Link>
          </p>
        )}

        <ul className="mt-6 flex flex-col gap-1 overflow-y-auto pb-10" style={{ maxHeight: "60svh" }}>
          {hits.map((h) => (
            <li key={h.slug}>
              <Link
                href={`/product/${h.slug}`}
                onClick={onClose}
                className="flex items-center gap-4 rounded-lg p-2.5 transition-colors hover:bg-espresso/70"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.image} alt="" className="h-16 w-12 rounded object-cover" />
                <span className="flex-1">
                  <span className="block font-display text-lg text-ivory">{h.name}</span>
                  <span className="block text-[11px] uppercase tracking-[0.18em] text-champagne/60">
                    {h.category}
                  </span>
                </span>
                {h.price != null && (
                  <span className="text-sm text-champagne">₹{h.price.toLocaleString("en-IN")}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
