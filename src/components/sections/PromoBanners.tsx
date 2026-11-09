import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { bannerArt } from "@/lib/art";

/** Section 8 — the two promotional banners. */
const BANNERS = [
  {
    key: "fabrics",
    eyebrow: "Premium Fabrics",
    title: ["The Right Fabric", "for Every Occasion"],
    body: "Cotton, linen, georgette, crepe and wool blends — sourced, tested and cut in our own facility.",
    cta: "Explore Fabrics",
    href: "/about#quality",
    art: "fabric" as const,
  },
  {
    key: "stitching",
    eyebrow: "Custom Stitching",
    title: ["Tailored", "for You"],
    body: "Send your measurements or your design. We pattern, sample and stitch it to your specification.",
    cta: "Learn More",
    href: "/wholesale#custom-stitching",
    art: "tailoring" as const,
  },
];

export default function PromoBanners() {
  return (
    <section aria-label="Featured services" className="mx-auto max-w-[1600px] px-6 pb-20 md:px-10 md:pb-24">
      <div className="grid gap-6 lg:grid-cols-2">
        {BANNERS.map((b) => (
          <article
            key={b.key}
            className="group relative flex min-h-[340px] overflow-hidden rounded-xl border border-copper/25 bg-espresso/40 shadow-card transition-all duration-500 hover:border-copper/70 hover:shadow-glow sm:min-h-[400px]"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/images/banners/${b.key}.webp`}
              alt={b.eyebrow}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-60 transition-all duration-[1200ms] group-hover:scale-[1.07] group-hover:opacity-75"
            />
            <span className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/88 to-charcoal/35" />

            <div className="relative flex flex-1 flex-col justify-center gap-4 p-8 md:p-12">
              <p className="eyebrow">{b.eyebrow}</p>
              <h3 className="font-display text-[34px] italic leading-[1.04] text-ivory md:text-[42px]">
                {b.title[0]}
                <span className="block not-italic gold-text">{b.title[1]}</span>
              </h3>
              <p className="max-w-sm text-[13.5px] leading-relaxed text-ivory/60">{b.body}</p>
              <Link
                href={b.href}
                className="btn-outline sheen mt-2 w-fit"
              >
                {b.cta} <ArrowRight size={15} />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
