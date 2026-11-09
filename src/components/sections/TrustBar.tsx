import { Truck, ShieldCheck, RefreshCcw, Lock } from "lucide-react";

/** Section 4 — trust strip directly beneath the hero. */
const ITEMS = [
  { icon: Truck, title: "Free Shipping", note: "On orders above ₹999" },
  { icon: ShieldCheck, title: "Quality Assured", note: "Premium fabrics & stitching" },
  { icon: RefreshCcw, title: "Easy Returns", note: "7-day hassle-free returns" },
  { icon: Lock, title: "Secure Payments", note: "100% safe & trusted" },
];

export default function TrustBar() {
  return (
    <section aria-label="Service guarantees" className="relative border-y border-copper/25 bg-deep">
      <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-y-6 px-6 py-6 md:grid-cols-4 md:px-10">
        {ITEMS.map(({ icon: Icon, title, note }, i) => (
          <div
            key={title}
            className={`flex items-center gap-3.5 ${i > 0 ? "md:border-l md:border-copper/20 md:pl-6" : ""}`}
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-copper/45 text-copper">
              <Icon size={18} strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <p className="truncate font-display text-[15px] leading-tight text-ivory">{title}</p>
              <p className="mt-0.5 truncate text-[11px] text-ivory/45">{note}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
