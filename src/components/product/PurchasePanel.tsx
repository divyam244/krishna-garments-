"use client";

import { useState } from "react";
import Link from "next/link";
import { ShoppingBag, Heart, Minus, Plus, MessageCircle, Truck } from "lucide-react";
import type { ProductView } from "@/lib/catalogue";
import { money } from "@/lib/format";
import { useSite } from "@/components/providers/SiteProviders";
import { SizePicker, ColourPicker, availabilityLabel } from "./QuickView";

/** Buy box for the product detail page: price, sizes, colours, qty, add to bag. */
export default function PurchasePanel({ product }: { product: ProductView }) {
  const [size, setSize] = useState(product.sizes[0] ?? "Free");
  const [colour, setColour] = useState(product.colours[0]?.name ?? "");
  const [qty, setQty] = useState(Math.max(1, product.minOrderQty));
  const { addToCart, toggleWishlist, inWishlist } = useSite();

  const enquiryOnly = product.priceOnRequest || product.availability === "OUT_OF_STOCK";
  const saved = inWishlist(product.slug);

  const waHref = (text: string) =>
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER
      ? `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`
      : "/wholesale#contact";

  return (
    <section aria-label="Purchase options" className="card flex flex-col gap-5 p-6">
      {/* Price */}
      <div className="flex items-end justify-between gap-4">
        <div className="flex items-baseline gap-3">
          {enquiryOnly || product.price == null ? (
            <span className="font-display text-[26px] italic text-champagne">Price on enquiry</span>
          ) : (
            <>
              <span className="font-display text-[34px] leading-none text-champagne">{money(product.price)}</span>
              {product.mrp && product.mrp > product.price && (
                <>
                  <span className="text-sm text-ivory/35 line-through">{money(product.mrp)}</span>
                  <span className="rounded-sm border border-ok/45 bg-ok/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-ok">
                    {Math.round((1 - product.price / product.mrp) * 100)}% off
                  </span>
                </>
              )}
            </>
          )}
        </div>
        <p className="text-right text-[11px] uppercase tracking-[0.14em] text-ivory/45">
          Inclusive of GST
          <br />
          <span className="text-champagne/70">{availabilityLabel(product)}</span>
        </p>
      </div>

      <SizePicker sizes={product.sizes} value={size} onChange={setSize} />
      <ColourPicker colours={product.colours} value={colour} onChange={setColour} />

      {!enquiryOnly && (
        <div className="flex items-center justify-between">
          <span className="label !mb-0">Quantity</span>
          <div className="flex items-center rounded-sm border border-copper/35">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(product.minOrderQty || 1, q - 1))}
              aria-label="Decrease quantity"
              className="grid h-10 w-10 place-items-center text-champagne hover:bg-espresso"
            >
              <Minus size={14} />
            </button>
            <output className="w-12 text-center text-[15px]" aria-live="polite">
              {qty}
            </output>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              aria-label="Increase quantity"
              className="grid h-10 w-10 place-items-center text-champagne hover:bg-espresso"
            >
              <Plus size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col gap-3">
        {enquiryOnly ? (
          <Link href="#enquiry" className="btn-solid sheen w-full">
            Enquire About This Piece
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => addToCart(product, size, colour, qty)}
            className="btn-solid sheen w-full"
          >
            <ShoppingBag size={16} /> Add to Bag
            {product.price != null && (
              <span className="ml-auto opacity-80">{money(product.price * qty)}</span>
            )}
          </button>
        )}

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => toggleWishlist(product.slug)}
            aria-pressed={saved}
            className="btn-outline"
          >
            <Heart size={15} className={saved ? "fill-copper text-copper" : ""} />
            {saved ? "Saved" : "Wishlist"}
          </button>
          <a
            href={waHref(`Hello Krishna Garments, I'm interested in ${product.name} (${product.sku}).`)}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
          >
            <MessageCircle size={15} /> Ask a Question
          </a>
        </div>

        <Link href="/cart" className="btn-ghost">
          View your bag
        </Link>
      </div>

      <ul className="flex flex-wrap gap-x-6 gap-y-2 border-t border-copper/15 pt-4 text-[11px] uppercase tracking-[0.14em] text-ivory/45">
        <li className="flex items-center gap-2">
          <Truck size={13} className="text-copper" /> Free shipping over ₹999
        </li>
        <li className="flex items-center gap-2">
          <Heart size={13} className="text-copper" /> 7-day returns
        </li>
      </ul>
    </section>
  );
}
