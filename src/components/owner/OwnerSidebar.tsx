"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingBag,
  Boxes,
  Scissors,
  CreditCard,
  Users,
  Truck,
  BarChart3,
  Settings,
  FileText,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { Emblem } from "@/components/layout/SiteHeader";

export const ownerNav = [
  { href: "/owner", label: "Dashboard", icon: LayoutDashboard },
  { href: "/owner/orders", label: "Orders", icon: ShoppingBag },
  { href: "/owner/inventory", label: "Inventory", icon: Boxes },
  { href: "/owner/production", label: "Production", icon: Scissors },
  { href: "/owner/payments", label: "Payments", icon: CreditCard },
  { href: "/owner/customers", label: "Customers", icon: Users },
  { href: "/owner/suppliers", label: "Suppliers", icon: Truck },
  { href: "/owner/invoices", label: "Invoices", icon: FileText },
  { href: "/owner/reports", label: "Reports", icon: BarChart3 },
  { href: "/owner/settings", label: "Settings", icon: Settings },
];

export default function OwnerSidebar({ owner }: { owner: { displayName: string; username: string } }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open dashboard menu"
        className="fixed bottom-5 right-5 z-40 grid h-12 w-12 place-items-center rounded-full border border-copper/50 bg-deep text-champagne shadow-card lg:hidden"
      >
        <Menu size={20} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/80 backdrop-blur-sm" />
          <div className="absolute inset-y-0 left-0 w-[268px]">{panel(true, () => setOpen(false))}</div>
        </div>
      )}

      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[264px] lg:block">{panel(false)}</aside>
    </>
  );

  function panel(mobile: boolean, onClose?: () => void) {
    return (
      <div className="relative flex h-full flex-col overflow-hidden border-r border-copper/20 bg-gradient-to-b from-deep via-charcoal to-espresso/40">
        {/* Brand block, matching the reference image */}
        <div className="flex flex-col items-center gap-3 border-b border-copper/20 px-5 py-7">
          <Emblem size={54} />
          <div className="text-center leading-none">
            <p className="font-display text-[21px] tracking-[0.16em] text-ivory">KRISHNA</p>
            <p className="mt-1.5 text-[9.5px] uppercase tracking-[0.42em] text-champagne">Garments</p>
          </div>
          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-copper/45 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-champagne">
            Owner Panel
          </span>
          {mobile && (
            <button type="button" onClick={onClose} aria-label="Close menu" className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full border border-copper/40 text-champagne">
              <X size={15} />
            </button>
          )}
        </div>

        <nav aria-label="Owner sections" className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {ownerNav.map((item) => {
              const active = item.href === "/owner" ? pathname === "/owner" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`group relative flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[13.5px] transition-all duration-300 ${
                      active
                        ? "border border-copper/45 bg-gradient-to-r from-espresso to-deep text-champagne shadow-glow"
                        : "border border-transparent text-ivory/62 hover:bg-espresso/55 hover:text-champagne"
                    }`}
                  >
                    <item.icon size={17} strokeWidth={1.6} className={active ? "text-copper" : "text-champagne/55"} />
                    {item.label}
                    {active && <span className="absolute -left-3 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-full bg-gradient-to-b from-champagne to-copper" />}
                  </Link>
                </li>
              );
            })}
            <li className="mt-2 pt-2 border-t border-copper/15">
              <form action="/api/owner/logout" method="POST">
                <button
                  type="submit"
                  className="w-full group flex items-center gap-3 rounded-md px-3.5 py-2.5 text-[13.5px] border border-transparent text-danger/80 hover:bg-danger/10 hover:text-danger transition-all duration-300"
                >
                  <LogOut size={17} strokeWidth={1.6} />
                  Logout
                </button>
              </form>
            </li>
          </ul>
        </nav>

        {/* Mannequin flourish from the reference design */}
        <div className="pointer-events-none relative h-40 shrink-0">
          <svg viewBox="0 0 120 160" className="absolute bottom-0 left-1/2 h-40 -translate-x-1/2 opacity-[0.18]" fill="none" stroke="#B87333" strokeWidth="1.4">
            <path d="M60 8c9 0 15 7 15 15s-6 13-6 20h-18c0-7-6-12-6-20S51 8 60 8z" />
            <path d="M42 45h36l10 22-8 6 6 70H34l6-70-8-6z" />
            <path d="M30 70c-6 10-8 24-6 38M90 70c6 10 8 24 6 38" />
            <path d="M60 45v98" strokeDasharray="3 5" />
          </svg>
          <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-espresso/50 to-transparent" />
        </div>
      </div>
    );
  }
}
