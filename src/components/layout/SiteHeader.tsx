"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Search, User, ShoppingBag, Menu, X, ChevronDown } from "lucide-react";
import { primaryNav, categories } from "@/lib/navigation";
import { brand } from "@/lib/brand";
import { useSite } from "@/components/providers/SiteProviders";
import SearchOverlay from "./SearchOverlay";
import CartDrawer from "./CartDrawer";

export default function SiteHeader() {
  const pathname = usePathname();
  const { count } = useSite();
  const [scrolled, setScrolled] = useState(false);
  const [drawer, setDrawer] = useState(false);
  const [search, setSearch] = useState(false);
  const [cart, setCart] = useState(false);
  const [clothingOpen, setClothingOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Sticky + condense on scroll (brief section 2).
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close overlays whenever the route changes.
  useEffect(() => {
    setDrawer(false);
    setSearch(false);
    setCart(false);
    setClothingOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawer || search || cart ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawer, search, cart]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href.split("?")[0] + "/");

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-[70] transition-all duration-500 ${
          scrolled
            ? "border-b border-copper/25 bg-charcoal/92 backdrop-blur-xl shadow-[0_10px_40px_-24px_rgba(0,0,0,.9)]"
            : "border-b border-transparent bg-gradient-to-b from-charcoal/85 to-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1600px] items-center gap-4 px-4 md:px-8">
          {/* Logo */}
          <Link
            href="/"
            className={`flex shrink-0 items-center gap-3 py-3 transition-all ${scrolled ? "scale-95 origin-left" : ""}`}
            aria-label={`${brand.name} home`}
          >
            <Emblem />
            <span className="leading-none">
              <span className="block font-display text-lg tracking-[0.16em] text-ivory md:text-xl">KRISHNA</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.42em] text-champagne">Garments</span>
            </span>
          </Link>

          <span className="hidden h-8 w-px bg-copper/25 lg:block" />

          {/* Desktop nav */}
          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Primary">
            {primaryNav.map((item) =>
              item.label === "Clothing" ? (
                <div
                  key={item.label}
                  className="relative"
                  onMouseEnter={() => {
                    clearTimeout(closeTimer.current);
                    setClothingOpen(true);
                  }}
                  onMouseLeave={() => {
                    closeTimer.current = setTimeout(() => setClothingOpen(false), 160);
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setClothingOpen((v) => !v)}
                    aria-expanded={clothingOpen}
                    className={`flex items-center gap-1 px-3 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors ${
                      clothingOpen ? "text-champagne" : isActive(item.href) ? "text-champagne" : "text-ivory/70 hover:text-champagne"
                    }`}
                  >
                    Clothing <ChevronDown size={13} className={clothingOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                  </button>
                  {clothingOpen && (
                    <div className="absolute left-1/2 top-full w-[620px] -translate-x-1/2 pt-2">
                      <div className="grid grid-cols-3 gap-x-4 rounded-lg border border-copper/30 bg-deep/97 p-5 shadow-card backdrop-blur-xl">
                        {categories.map((c) => (
                          <Link
                            key={c.slug}
                            href={`/clothing/${c.slug}`}
                            className="rounded px-2 py-1.5 text-[12.5px] text-ivory/72 transition-colors hover:bg-espresso hover:text-champagne"
                          >
                            {c.name}
                          </Link>
                        ))}
                        <Link
                          href="/clothing"
                          className="col-span-3 mt-2 border-t border-copper/20 pt-3 text-[11px] uppercase tracking-[0.2em] text-champagne"
                        >
                          View all clothing →
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`relative px-3 py-2 text-[12px] uppercase tracking-[0.14em] transition-colors ${
                    isActive(item.href) ? "text-champagne" : "text-ivory/70 hover:text-champagne"
                  }`}
                >
                  {item.label}
                  {item.badge === "sale" && (
                    <span className="absolute -right-0.5 top-1 h-1.5 w-1.5 rounded-full bg-danger" />
                  )}
                  {isActive(item.href) && (
                    <span className="absolute inset-x-3 -bottom-0.5 h-px bg-gradient-to-r from-transparent via-copper to-transparent" />
                  )}
                </Link>
              ),
            )}
          </nav>

          {/* Actions */}
          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <IconButton label="Search" onClick={() => setSearch(true)}>
              <Search size={18} />
            </IconButton>
            <Link href="/account" aria-label="Customer account" className="hidden h-10 w-10 place-items-center rounded-full text-ivory/75 transition-colors hover:bg-copper/12 hover:text-champagne sm:grid">
              <User size={18} />
            </Link>
            <button
              type="button"
              onClick={() => setCart(true)}
              aria-label={`Shopping bag, ${count} items`}
              className="relative grid h-10 w-10 place-items-center rounded-full text-ivory/75 transition-colors hover:bg-copper/12 hover:text-champagne"
            >
              <ShoppingBag size={18} />
              {count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-gradient-to-br from-copper to-champagne px-1 text-[9px] font-semibold text-charcoal">
                  {count > 99 ? "99+" : count}
                </span>
              )}
            </button>
            <IconButton label="Menu" onClick={() => setDrawer(true)} className="lg:hidden">
              <Menu size={20} />
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <MobileDrawer open={drawer} onClose={() => setDrawer(false)} />
      <SearchOverlay open={search} onClose={() => setSearch(false)} />
      <CartDrawer open={cart} onClose={() => setCart(false)} />
    </>
  );
}

/** Copper-gold K emblem (brief section 2). */
export function Emblem({ size = 40 }: { size?: number }) {
  return (
    <span
      className="relative grid shrink-0 place-items-center rounded-sm border border-copper/50"
      style={{ width: size, height: size, background: "linear-gradient(145deg,#302016,#1D1916)" }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size * 0.66} height={size * 0.66}>
        <defs>
          <linearGradient id="kg-emblem" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#D49A60" />
            <stop offset="1" stopColor="#B87333" />
          </linearGradient>
        </defs>
        <text
          x="20"
          y="29"
          textAnchor="middle"
          fontFamily="Cormorant Garamond, Georgia, serif"
          fontSize="28"
          fontWeight="600"
          fill="url(#kg-emblem)"
        >
          K
        </text>
        {/* Leaf accent echoing the reference logo */}
        <path d="M27 9c3 0 5 2 5 5-3 0-5-2-5-5z" fill="url(#kg-emblem)" opacity=".85" />
      </svg>
    </span>
  );
}

function IconButton({
  children,
  label,
  onClick,
  className = "",
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={`grid h-10 w-10 place-items-center rounded-full text-ivory/75 transition-colors hover:bg-copper/12 hover:text-champagne ${className}`}
    >
      {children}
    </button>
  );
}

function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <div
      className={`fixed inset-0 z-[80] lg:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-ink/80 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0"
        }`}
      />
      <nav
        aria-label="Mobile"
        className={`absolute inset-y-0 right-0 flex w-[min(88vw,380px)] flex-col overflow-y-auto border-l border-copper/25 bg-deep transition-transform duration-400 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-copper/20 px-5 py-4">
          <div className="flex items-center gap-3">
            <Emblem size={34} />
            <span className="font-display tracking-[0.14em]">KRISHNA</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close menu" className="grid h-9 w-9 place-items-center rounded-full border border-copper/35 text-champagne">
            <X size={16} />
          </button>
        </div>

        <ul className="flex flex-col px-2 py-3">
          {primaryNav.map((item) => (
            <li key={item.label}>
              <Link
                href={item.href}
                onClick={onClose}
                className="flex items-center justify-between rounded px-4 py-3 text-[13px] uppercase tracking-[0.16em] text-ivory/78 transition-colors hover:bg-espresso hover:text-champagne"
              >
                {item.label}
                {item.badge === "sale" && <span className="chip !text-[9px] text-danger">Sale</span>}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hairline my-2" />

        <p className="px-5 pb-1 pt-3 text-[10px] uppercase tracking-[0.28em] text-champagne/70">Categories</p>
        <ul className="grid grid-cols-2 gap-1 px-3 pb-4">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/clothing/${c.slug}`}
                onClick={onClose}
                className="block truncate rounded px-3 py-2 text-[12px] text-ivory/65 hover:bg-espresso hover:text-champagne"
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hairline my-2" />
        <div className="flex flex-col gap-2 px-5 py-5">
          <Link href="/wholesale" onClick={onClose} className="btn-solid">
            Wholesale Enquiry
          </Link>
          <Link href="/account" onClick={onClose} className="btn-outline">
            My Account
          </Link>
        </div>
      </nav>
    </div>
  );
}
