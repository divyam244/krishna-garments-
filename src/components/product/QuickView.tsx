"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, Heart, ShoppingBag, ArrowRight } from "lucide-react";
import type { ProductView } from "@/lib/catalogue";
import { money } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";

/** Lightweight modal: sizes, colours, add-to-bag, and a route to the full page. */
export default function QuickView({ product, onClose }: { product: ProductView; onClose: () => void }) {
  const [size, setSize] = useState(product.sizes[0] ?? "Free");
  const [colour, setColour] = useState(product.colours[0]?.name ?? "");
  const { addToCart, toggleWishlist, inWishlist } = useSite();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    // Lock background scroll while the modal is open.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-ink/85 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`${product.name} quick view`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative grid max-h-[92svh] w-full max-w-4xl overflow-y-auto rounded-xl border border-copper/30 bg-deep shadow-card md:grid-cols-2"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close quick view"
          className="absolute right-3 top-3 z-10 grid h-9 w-9 place-items-center rounded-full border border-copper/40 bg-charcoal/70 text-champagne hover:bg-espresso"
        >
          <X size={16} />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={product.image} alt={product.name} className="h-64 w-full object-cover md:h-full md:min-h-[440px]" />

        <div className="flex flex-col gap-5 p-6 md:p-8">
          <div>
            <p className="text-[10px] uppercase tracking-[0.24em] text-champagne/70">{product.categoryName}</p>
            <h2 className="mt-2 font-display text-3xl leading-tight">{product.name}</h2>
          </div>

          <p className="text-sm leading-relaxed text-ivory/70">{product.description}</p>

          <div className="flex items-baseline gap-3">
            {product.priceOnRequest || product.price == null ? (
              <span className="text-xs uppercase tracking-[0.2em] text-champagne">Wholesale enquiry</span>
            ) : (
              <>
                <span className="text-2xl text-champagne">{money(product.price)}</span>
                {product.mrp && product.mrp > product.price && (
                  <span className="text-sm text-ivory/35 line-through">{money(product.mrp)}</span>
                )}
              </>
            )}
          </div>

          <SizePicker sizes={product.sizes} value={size} onChange={setSize} />
          <ColourPicker colours={product.colours} value={colour} onChange={setColour} />

          <dl className="grid grid-cols-2 gap-3 text-xs">
            <div className="rounded border border-copper/20 bg-charcoal/50 p-3">
              <dt className="text-ivory/45">Material</dt>
              <dd className="mt-1 text-ivory/85">{product.fabric}</dd>
            </div>
            <div className="rounded border border-copper/20 bg-charcoal/50 p-3">
              <dt className="text-ivory/45">Availability</dt>
              <dd className="mt-1 text-ivory/85">{availabilityLabel(product)}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-3 pt-1">
            {product.priceOnRequest || product.availability === "OUT_OF_STOCK" ? (
              <Link href={`/product/${product.slug}#enquiry`} className="btn-solid flex-1">
                Enquire <ArrowRight size={15} />
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => {
                  addToCart(product, size, colour, Math.max(1, product.minOrderQty));
                  onClose();
                }}
                className="btn-solid sheen flex-1"
              >
                <ShoppingBag size={15} /> Add to Bag
              </button>
            )}
            <button
              type="button"
              onClick={() => toggleWishlist(product.slug)}
              className="btn-outline"
              aria-pressed={inWishlist(product.slug)}
            >
              <Heart size={15} className={inWishlist(product.slug) ? "fill-copper text-copper" : ""} />
              {inWishlist(product.slug) ? "Saved" : "Save"}
            </button>
          </div>

          <Link
            href={`/product/${product.slug}`}
            className="text-[11px] uppercase tracking-[0.2em] text-champagne/75 underline decoration-copper/40 underline-offset-4 hover:text-champagne"
          >
            View full details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export function SizePicker({
  sizes,
  value,
  onChange,
}: {
  sizes: string[];
  value: string;
  onChange: (s: string) => void;
}) {
  return (
    <div>
      <p className="label">Size</p>
      <div className="flex flex-wrap gap-2">
        {sizes.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            aria-pressed={value === s}
            className={`min-w-11 rounded-sm border px-3 py-2 text-xs transition-colors ${
              value === s
                ? "border-copper bg-copper/18 text-champagne"
                : "border-ivory/18 text-ivory/65 hover:border-copper/55"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ColourPicker({
  colours,
  value,
  onChange,
}: {
  colours: { name: string; hex: string }[];
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div>
      <p className="label">Colour — {value}</p>
      <div className="flex flex-wrap gap-2.5">
        {colours.map((c) => (
          <button
            key={c.name}
            type="button"
            onClick={() => onChange(c.name)}
            aria-pressed={value === c.name}
            aria-label={c.name}
            title={c.name}
            className={`h-8 w-8 rounded-full border-2 transition-all ${
              value === c.name ? "scale-110 border-champagne" : "border-ivory/25 hover:border-copper/60"
            }`}
            style={{ background: c.hex }}
          />
        ))}
      </div>
    </div>
  );
}

export function availabilityLabel(p: ProductView): string {
  switch (p.availability) {
    case "IN_STOCK":
      return `In stock · ${p.stockOnHand} units`;
    case "LOW_STOCK":
      return `Only ${p.stockOnHand} left`;
    case "MADE_TO_ORDER":
      return `Made to order · MOQ ${p.minOrderQty}`;
    default:
      return "Enquire for availability";
  }
}
