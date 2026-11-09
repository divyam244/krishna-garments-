"use client";

import { useState } from "react";
import Link from "next/link";
import { Heart, Eye, ShoppingBag } from "lucide-react";
import type { ProductView } from "@/lib/catalogue";
import { money } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";
import QuickView from "./QuickView";

export default function ProductCard({
  product,
  compact = false,
}: {
  product: ProductView;
  compact?: boolean;
}) {
  const { toggleWishlist, inWishlist, addToCart } = useSite();
  const [open, setOpen] = useState(false);
  const saved = inWishlist(product.slug);

  // Default selection for one-tap add: first size, first colour.
  const quickAdd = () => addToCart(product, product.sizes[0] ?? "Free", product.colours[0]?.name ?? "");

  return (
    <>
      <article
        className={`group relative flex shrink-0 flex-col overflow-hidden rounded-lg border border-copper/20 bg-deep transition-all duration-500 hover:border-copper/60 hover:shadow-glow ${
          compact ? "w-[190px] md:w-[236px]" : "w-[230px] md:w-[276px]"
        }`}
      >
        {/* Image */}
        <Link href={`/product/${product.slug}`} className="relative block aspect-[3/4] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          />
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-charcoal via-transparent to-transparent opacity-80" />

          <div className="absolute left-3 top-3 flex flex-col gap-1.5">
            {product.isNewArrival && (
              <span className="rounded-sm bg-gradient-to-r from-copper to-champagne px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-charcoal">
                New
              </span>
            )}
            {product.onSale && (
              <span className="rounded-sm border border-danger/60 bg-charcoal/70 px-2 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-danger">
                Sale
              </span>
            )}
            {product.availability === "LOW_STOCK" && (
              <span className="rounded-sm border border-warn/50 bg-charcoal/70 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-warn">
                Low stock
              </span>
            )}
            {product.availability === "OUT_OF_STOCK" && (
              <span className="rounded-sm border border-ivory/30 bg-charcoal/80 px-2 py-1 text-[9px] uppercase tracking-[0.16em] text-ivory/60">
                Enquire
              </span>
            )}
          </div>

          {/* Hover actions */}
          <div className="absolute bottom-3 left-3 right-3 flex translate-y-3 gap-2 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setOpen(true);
              }}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-sm border border-copper/50 bg-charcoal/85 py-2 text-[10px] uppercase tracking-[0.14em] text-champagne backdrop-blur hover:bg-espresso"
            >
              <Eye size={13} /> Quick View
            </button>
            {!product.priceOnRequest && product.availability !== "OUT_OF_STOCK" && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  quickAdd();
                }}
                aria-label={`Add ${product.name} to bag`}
                className="grid h-8 w-8 place-items-center rounded-sm bg-gradient-to-r from-copper to-champagne text-charcoal hover:brightness-110"
              >
                <ShoppingBag size={14} />
              </button>
            )}
          </div>
        </Link>

        {/* Wishlist sits outside the image link so it never navigates */}
        <button
          type="button"
          onClick={() => toggleWishlist(product.slug)}
          aria-pressed={saved}
          aria-label={saved ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-copper/35 bg-charcoal/70 backdrop-blur transition-colors hover:border-copper"
        >
          <Heart
            size={15}
            className={saved ? "fill-copper text-copper" : "text-champagne"}
          />
        </button>

        {/* Meta */}
        <div className="flex flex-1 flex-col gap-2 p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-champagne/60">{product.categoryName}</p>
          <h3 className="font-display text-[17px] leading-snug text-ivory">
            <Link href={`/product/${product.slug}`} className="hover:text-champagne">
              {product.name}
            </Link>
          </h3>

          <div className="mt-auto flex items-baseline gap-2">
            {product.priceOnRequest || product.price == null ? (
              <Link
                href={`/product/${product.slug}#enquiry`}
                className="text-[11px] uppercase tracking-[0.18em] text-champagne underline decoration-copper/50 underline-offset-4 hover:text-ivory"
              >
                Wholesale Enquiry
              </Link>
            ) : (
              <>
                <span className="text-[15px] font-medium text-champagne">{money(product.price)}</span>
                {product.mrp && product.mrp > product.price ? (
                  <span className="text-xs text-ivory/35 line-through">{money(product.mrp)}</span>
                ) : null}
              </>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 pt-1">
            <ul className="flex gap-1.5" aria-label="Available colours">
              {product.colours.slice(0, 4).map((c) => (
                <li
                  key={c.name}
                  title={c.name}
                  className="h-3.5 w-3.5 rounded-full border border-ivory/25"
                  style={{ background: c.hex }}
                />
              ))}
            </ul>
            <p className="truncate text-[10px] uppercase tracking-[0.14em] text-ivory/40">
              {product.sizes.join(" · ")}
            </p>
          </div>

          {product.isSample && (
            <p className="sample-tag w-fit">Sample data</p>
          )}
        </div>
      </article>

      {open && <QuickView product={product} onClose={() => setOpen(false)} />}
    </>
  );
}
