import Link from "next/link";
import { Facebook, Instagram, Youtube, Twitter, Mail, MapPin, Phone } from "lucide-react";
import { footerColumns } from "@/lib/navigation";
import { brand } from "@/lib/brand";
import { Emblem } from "./SiteHeader";
import NewsletterForm from "./NewsletterForm";

export default function SiteFooter() {
  return (
    <footer className="relative mt-24 border-t border-copper/25 bg-charcoal">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-champagne/60 to-transparent" />

      <div className="mx-auto grid max-w-[1600px] gap-12 px-6 py-16 md:px-10 lg:grid-cols-[1.3fr_repeat(3,minmax(0,1fr))_1.5fr] lg:gap-8 lg:py-20">
        {/* Brand */}
        <div>
          <Link href="/" className="flex items-center gap-3">
            <Emblem size={44} />
            <span>
              <span className="block font-display text-xl tracking-[0.16em]">KRISHNA</span>
              <span className="mt-1 block text-[9px] uppercase tracking-[0.42em] text-champagne">Garments</span>
            </span>
          </Link>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/55">
            Designing and manufacturing women&apos;s fashion since our first stitch — from fabric selection to the
            finished garment in your hands.
          </p>
          <ul className="mt-6 space-y-2.5 text-[13px] text-ivory/55">
            <li className="flex items-start gap-2.5">
              <MapPin size={15} className="mt-0.5 shrink-0 text-copper" />
              <span>Krishna Garments, Textile Market Road, Surat, Gujarat, India</span>
            </li>
            <li className="flex items-center gap-2.5">
              <Phone size={15} className="shrink-0 text-copper" />
              <a href={`tel:${process.env.NEXT_PUBLIC_BUSINESS_PHONE ?? ""}`} className="hover:text-champagne">
                {process.env.NEXT_PUBLIC_BUSINESS_PHONE || "Phone number not configured"}
              </a>
            </li>
            <li className="flex items-center gap-2.5">
              <Mail size={15} className="shrink-0 text-copper" />
              <a href={`mailto:${process.env.NEXT_PUBLIC_BUSINESS_EMAIL}`} className="hover:text-champagne">
                {process.env.NEXT_PUBLIC_BUSINESS_EMAIL}
              </a>
            </li>
          </ul>
        </div>

        {/* Link columns */}
        {footerColumns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="mb-5 text-[11px] uppercase tracking-[0.28em] text-champagne">{col.title}</h3>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[13.5px] text-ivory/60 transition-colors hover:text-champagne"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}

        {/* Newsletter */}
        <div>
          <h3 className="mb-5 text-[11px] uppercase tracking-[0.28em] text-champagne">Stay Updated</h3>
          <p className="mb-4 text-sm leading-relaxed text-ivory/55">
            New drops, wholesale lots and restock alerts. No noise.
          </p>
          <NewsletterForm />
          <div className="mt-7 flex gap-2.5">
            {[
              { icon: Instagram, label: "Instagram" },
              { icon: Facebook, label: "Facebook" },
              { icon: Youtube, label: "YouTube" },
              { icon: Twitter, label: "X" },
            ].map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
                aria-label={label}
                className="grid h-10 w-10 place-items-center rounded-full border border-copper/30 text-champagne/80 transition-all hover:border-copper hover:bg-copper/12 hover:text-champagne"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="border-t border-copper/15">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-3 px-6 py-5 text-[11px] uppercase tracking-[0.16em] text-ivory/40 md:flex-row md:px-10">
          <p>
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/support#privacy" className="hover:text-champagne">Privacy</Link>
            <Link href="/support#terms" className="hover:text-champagne">Terms</Link>
            <Link href="/owner" className="rounded border border-copper/30 px-3 py-1 text-champagne/70 hover:border-copper hover:text-champagne">
              Owner Panel
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
