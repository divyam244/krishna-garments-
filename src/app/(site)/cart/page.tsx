"use client";

import { useState } from "react";
import Link from "next/link";
import { Trash2, Minus, Plus, ShoppingBag, ArrowRight, Loader2 } from "lucide-react";
import { useSite } from "@/components/providers/SiteProviders";
import { money } from "@/lib/format";

const FREE_SHIP = 999;

export default function CartPage() {
  const { cart, updateQty, removeLine, subtotal, clearCart, toast } = useSite();
  const [placing, setPlacing] = useState(false);

  const shipping = subtotal >= FREE_SHIP || subtotal === 0 ? 0 : 80;
  const total = subtotal + shipping;
  const toFreeShip = Math.max(0, FREE_SHIP - subtotal);

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    setPlacing(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lines: cart }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Could not place the order.");
      clearCart();
      toast(`Order ${data.orderNo} recorded — we'll confirm payment shortly.`, "success");
    } catch (err) {
      toast((err as Error).message, "error");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <header className="mb-10">
        <p className="eyebrow mb-3">Your selection</p>
        <h1 className="font-display text-4xl md:text-[52px]">Shopping Bag</h1>
      </header>

      {cart.length === 0 ? (
        <div className="card flex flex-col items-center gap-5 p-14 text-center">
          <span className="grid h-16 w-16 place-items-center rounded-full border border-copper/30 text-champagne/60">
            <ShoppingBag size={24} />
          </span>
          <h2 className="font-display text-3xl">Nothing in the bag yet</h2>
          <p className="max-w-md text-sm leading-relaxed text-ivory/50">
            Everything you add is made by us, so you can buy a single jacket or an entire size-set.
          </p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/clothing?tag=new" className="btn-solid">Shop New Arrivals</Link>
            <Link href="/wholesale" className="btn-outline">Wholesale Desk</Link>
          </div>
        </div>
      ) : (
        <form onSubmit={placeOrder} className="grid gap-10 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y divide-copper/15 border-y border-copper/20">
            {cart.map((line) => (
              <li key={line.key} className="flex gap-5 py-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={line.image} alt="" className="h-32 w-[96px] shrink-0 rounded object-cover" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-4">
                    <Link href={`/product/${line.slug}`} className="font-display text-[21px] leading-tight hover:text-champagne">
                      {line.name}
                    </Link>
                    <button type="button" onClick={() => removeLine(line.key)} aria-label={`Remove ${line.name}`} className="text-ivory/35 hover:text-danger">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <p className="text-[11px] uppercase tracking-[0.16em] text-ivory/45">
                    Size {line.size} · {line.colour}
                  </p>
                  <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-3">
                    <div className="flex items-center rounded-sm border border-copper/35">
                      <button type="button" onClick={() => updateQty(line.key, line.quantity - 1)} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center text-champagne hover:bg-espresso">
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center">{line.quantity}</span>
                      <button type="button" onClick={() => updateQty(line.key, line.quantity + 1)} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center text-champagne hover:bg-espresso">
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="text-right">
                      <span className="block font-display text-[20px] text-champagne">
                        {line.price == null ? "Enquire" : money(line.price * line.quantity)}
                      </span>
                      {line.price != null && (
                        <span className="text-[11px] text-ivory/40">{money(line.price)} each</span>
                      )}
                    </p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {/* Summary */}
          <aside className="lg:sticky lg:top-28 lg:h-fit">
            <div className="card flex flex-col gap-4 p-7">
              <h2 className="font-display text-[26px]">Summary</h2>

              <dl className="flex flex-col gap-2.5 text-[13.5px]">
                <Row label={`Subtotal (${cart.length} styles)`} value={money(subtotal)} />
                <Row label="Shipping" value={shipping === 0 ? "Free" : money(shipping)} />
                <div className="hairline my-1" />
                <div className="flex items-baseline justify-between">
                  <dt className="text-[11px] uppercase tracking-[0.2em] text-ivory/60">Total payable</dt>
                  <dd className="font-display text-[30px] leading-none text-champagne">{money(total)}</dd>
                </div>
              </dl>

              {toFreeShip > 0 && (
                <p className="rounded border border-copper/30 bg-espresso/50 px-3 py-2.5 text-[11.5px] leading-relaxed text-champagne/85">
                  Add {money(toFreeShip)} more for free shipping.
                </p>
              )}

              <button type="submit" disabled={placing} className="btn-solid sheen w-full">
                {placing ? (
                  <>
                    <Loader2 size={15} className="animate-spin" /> Recording order…
                  </>
                ) : (
                  <>Place Order <ArrowRight size={15} /></>
                )}
              </button>

              <p className="text-[11px] leading-relaxed text-ivory/40">
                Payment is confirmed with our desk after the order is recorded — we do not take card details on this
                page. GST invoice issued against your business name where applicable.
              </p>

              <button type="button" onClick={clearCart} className="btn-ghost">
                Empty the bag
              </button>
            </div>
          </aside>
        </form>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ivory/55">{label}</dt>
      <dd className="text-ivory/90">{value}</dd>
    </div>
  );
}
