import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag, Heart, Truck, FileText, ArrowRight } from "lucide-react";
import WishlistPanel from "@/components/account/WishlistPanel";

export const metadata: Metadata = { title: "My Account", description: "Your Krishna Garments account." };

/**
 * Customer account. Public customer login is intentionally not part of this
 * release (brief section 14 scopes authentication to the owner panel), so this
 * page works on device-local data: saved wishlist plus a track-order lookup.
 */
export default function AccountPage() {
  return (
    <div className="mx-auto max-w-[1200px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <header className="mb-12">
        <p className="eyebrow mb-3">Customer</p>
        <h1 className="font-display text-4xl md:text-[52px]">My Account</h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ivory/55">
          Your saved pieces and order tracking live on this device. Share your phone number with our desk and we can
          look up anything you have ordered.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <WishlistPanel />

        <div className="flex flex-col gap-6">
          <TrackOrderCard />

          <section className="card p-7">
            <h2 className="mb-4 flex items-center gap-3 font-display text-[22px]">
              <FileText size={18} className="text-copper" /> Quick links
            </h2>
            <ul className="flex flex-col gap-2.5 text-[13.5px]">
              {[
                ["/clothing", "Browse the catalogue", ShoppingBag],
                ["/wholesale", "Wholesale & bulk enquiry", Truck],
                ["/support", "Shipping, returns & FAQs", FileText],
                ["/cart", "Open your bag", ShoppingBag],
              ].map(([href, label, Icon]) => {
                const L = label as string;
                const H = href as string;
                const I = Icon as typeof ShoppingBag;
                return (
                  <li key={H}>
                    <Link href={H} className="group flex items-center gap-3 rounded px-2 py-2 hover:bg-espresso/60">
                      <I size={15} className="text-champagne/70" />
                      <span className="flex-1 text-ivory/70 group-hover:text-champagne">{L}</span>
                      <ArrowRight size={14} className="text-ivory/25 transition-transform group-hover:translate-x-1" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

async function TrackOrderCard() {
  const { default: Tracker } = await import("@/components/account/TrackOrder");
  return <Tracker />;
}
