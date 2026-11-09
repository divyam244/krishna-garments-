"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";
import { useSite } from "@/components/providers/SiteProviders";
import ProductCard from "@/components/product/ProductCard";
import type { ProductView } from "@/lib/catalogue";
import { useEffect, useState } from "react";

export default function WishlistPanel() {
  const { wishlist, toggleWishlist } = useSite();
  const [all, setAll] = useState<ProductView[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((rows: ProductView[]) => setAll(Array.isArray(rows) ? rows : []))
      .catch(() => {});
  }, []);

  const saved = all.filter((p) => wishlist.includes(p.slug));

  return (
    <section className="card p-7" aria-labelledby="wishlist-title">
      <header className="mb-5 flex items-center justify-between gap-4">
        <h2 id="wishlist-title" className="flex items-center gap-3 font-display text-[22px]">
          <Heart size={18} className="text-copper" /> Saved pieces
          <span className="chip">{saved.length}</span>
        </h2>
        {saved.length > 0 && (
          <button
            type="button"
            onClick={() => saved.forEach((p) => toggleWishlist(p.slug))}
            className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-ivory/45 hover:text-danger"
          >
            <Trash2 size={13} /> Clear
          </button>
        )}
      </header>

      {saved.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <p className="font-display text-xl text-ivory/70">Nothing saved yet</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-ivory/45">
            Tap the heart on any product to keep it here while you decide.
          </p>
          <Link href="/clothing" className="btn-outline mt-2">Browse Clothing</Link>
        </div>
      ) : (
        <>
          <ul className="no-scrollbar -mx-2 flex gap-5 overflow-x-auto px-2 pb-2">
            {saved.map((p) => (
              <li key={p.slug} className="shrink-0">
                <ProductCard product={p} compact />
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[11px] text-ivory/35">Saved to this device only.</p>
        </>
      )}
    </section>
  );
}
