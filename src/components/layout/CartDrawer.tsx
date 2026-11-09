"use client";

import { useState } from "react";
import Link from "next/link";
import { X, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useSite } from "@/components/providers/SiteProviders";
import { money } from "@/lib/format";

export default function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { cart, updateQty, removeLine, subtotal, clearCart, toast } = useSite();
  const [placing, setPlacing] = useState(false);

  if (!open) return null;

  const checkout = async () => {
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: cart }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");
      clearCart();
      toast(`Order ${data.orderNo} placed`, "success");
      onClose();
    } catch (e) {
      toast((e as Error).message, "error");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[86]">
      <div onClick={onClose} className="absolute inset-0 bg-ink/75 backdrop-blur-sm" />
      <aside
        aria-label="Shopping bag"
        className="absolute inset-y-0 right-0 flex w-[min(94vw,440px)] flex-col border-l border-copper/25 bg-deep shadow-card"
      >
        <header className="flex items-center justify-between border-b border-copper/20 px-5 py-4">
          <h2 className="flex items-center gap-3 font-display text-xl">
            <ShoppingBag size={18} className="text-champagne" /> Your Bag
            <span className="chip">{cart.length} style{cart.length === 1 ? "" : "s"}</span>
          </h2>
          <button type="button" onClick={onClose} aria-label="Close bag" className="grid h-9 w-9 place-items-center rounded-full border border-copper/35 text-champagne hover:bg-espresso">
            <X size={16} />
          </button>
        </header>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full border border-copper/30 text-champagne/60">
              <ShoppingBag size={24} />
            </span>
            <p className="font-display text-2xl text-ivory/80">Your bag is empty</p>
            <p className="text-sm text-ivory/50">
              Every piece is made in our own facility — start with what is new this week.
            </p>
            <Link href="/clothing?tag=new" onClick={onClose} className="btn-solid mt-2">
              Shop New Arrivals
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-copper/12 overflow-y-auto px-5">
              {cart.map((line) => (
                <li key={line.key} className="flex gap-4 py-4">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.image} alt="" className="h-24 w-[70px] shrink-0 rounded object-cover" />
                  <div className="flex flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/product/${line.slug}`} onClick={onClose} className="font-display text-[17px] leading-tight hover:text-champagne">
                        {line.name}
                      </Link>
                      <button type="button" onClick={() => removeLine(line.key)} aria-label={`Remove ${line.name}`} className="text-ivory/35 hover:text-danger">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <p className="text-[11px] uppercase tracking-[0.14em] text-ivory/45">
                      {line.size} · {line.colour}
                    </p>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center rounded-sm border border-copper/30">
                        <button
                          type="button"
                          onClick={() => updateQty(line.key, line.quantity - 1)}
                          aria-label="Decrease quantity"
                          className="grid h-8 w-8 place-items-center text-champagne hover:bg-espresso"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-8 text-center text-sm">{line.quantity}</span>
                        <button
                          type="button"
                          onClick={() => updateQty(line.key, line.quantity + 1)}
                          aria-label="Increase quantity"
                          className="grid h-8 w-8 place-items-center text-champagne hover:bg-espresso"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="text-sm text-champagne">
                        {line.price == null ? "Enquire" : money(line.price * line.quantity)}
                      </span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <footer className="border-t border-copper/20 p-5">
              <div className="flex items-baseline justify-between">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ivory/55">Subtotal</span>
                <span className="font-display text-2xl text-champagne">{money(subtotal)}</span>
              </div>
              <p className="mt-1 text-[11px] text-ivory/40">
                Shipping and GST are confirmed at checkout. Free shipping on orders above ₹999.
              </p>
              <button type="button" onClick={checkout} disabled={placing} className="btn-solid sheen mt-4 w-full">
                {placing ? "Placing order…" : "Place Enquiry Order"}
              </button>
              <Link href="/wholesale" onClick={onClose} className="btn-ghost mt-2 w-full">
                Buying in bulk? Wholesale enquiry
              </Link>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
