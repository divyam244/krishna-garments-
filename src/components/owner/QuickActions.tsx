"use client";

import Link from "next/link";
import { Plus, Boxes, UserPlus, FileText, BarChart3, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/** Quick-action row from the reference design — every tile routes to a working screen. */
const ACTIONS = [
  { label: "New Order", href: "/owner/orders?new=1", icon: Plus },
  { label: "Start Production", href: "/owner/production?new=1", icon: Boxes },
  { label: "Update Stock", href: "/owner/inventory?new=1", icon: Boxes },
  { label: "Add Customer", href: "/owner/customers?new=1", icon: UserPlus },
  { label: "Create Invoice", href: "/owner/payments?new=1", icon: FileText },
  { label: "View Reports", href: "/owner/reports", icon: BarChart3 },
];

const ACTIONS_BY: Record<string, string> = {
  orders: "/owner/orders?new=1",
  production: "/owner/production?new=1",
  inventory: "/owner/inventory?new=1",
  customers: "/owner/customers?new=1",
  payments: "/owner/payments?new=1",
};

export function QuickActions({ openNew }: { openNew?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = !!openNew || searchParams.get("new") === "1";

  if (active) {
    return (
      <div className="mb-5 flex items-center justify-between rounded-xl border border-copper/40 bg-gradient-to-r from-espresso/80 via-deep to-charcoal px-4 py-3 sm:px-5">
        <div className="flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-copper/45 bg-copper/12 text-copper">
            <Plus size={16} />
          </span>
          <p className="text-[12.5px] text-ivory/80">
            Create mode is active. Click any tile below to open its creation form, then dismiss this banner with the "x".
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.replace(pathname)}
          aria-label="Dismiss create mode"
          className="grid h-8 w-8 place-items-center rounded-full border border-copper/40 text-ivory/60 hover:border-copper hover:text-champagne"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
      {ACTIONS.map((a) => (
        <Link
          key={a.label}
          href={ACTIONS_BY[a.label.toLowerCase()] ?? a.href}
          className="sheen group flex flex-col items-center justify-center gap-3 rounded-xl border border-copper/25 bg-gradient-to-b from-espresso/70 to-deep px-4 py-6 text-center transition-all duration-400 hover:border-copper/70 hover:shadow-glow"
        >
          <span className="grid h-11 w-11 place-items-center rounded-full border border-copper/45 text-copper transition-colors group-hover:bg-copper/12 group-hover:text-champagne">
            <a.icon size={20} strokeWidth={1.5} />
          </span>
          <span className="text-[12.5px] leading-tight text-ivory/78 group-hover:text-champagne">{a.label}</span>
        </Link>
      ))}
    </div>
  );
}
