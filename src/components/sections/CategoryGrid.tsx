"use client";

/**
 * Section 7 — Clothing Categories.
 * Displays all 12 women's fashion categories with rich photos, prominent headings,
 * and clear descriptive subtitles below each item.
 */

import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";
import { categories } from "@/lib/navigation";
import { garmentArt } from "@/lib/art";

const CATEGORY_SUBTITLES: Record<string, string> = {
  "coord-sets": "Matching Two-Piece Sets",
  "tops": "Blouses & Modern Bodices",
  "jeans": "Structured Denim Fits",
  "dresses": "Midi, Maxi & Shirt Cuts",
  "jackets": "Tailored Blazers & Outerwear",
  "kurtis": "Hand-Detailed Tunics",
  "shirts": "Pure Cotton & Crisp Linen",
  "trousers": "Wide-Leg & Cigarette Cuts",
  "skirts": "Pleated & Satin Silhouettes",
  "ethnic-wear": "Sarees, Blouses & Sets",
  "party-wear": "Evening Gowns & Sequins",
  "accessories": "Jewelry & Finishing Accents",
};

export default function CategoryGrid() {
  return (
    <section aria-labelledby="category-title" className="relative py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        <header className="mb-14 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-copper/40 bg-espresso/60 px-4 py-1.5 text-[11px] uppercase tracking-[0.3em] text-champagne backdrop-blur-sm">
            <Layers size={12} className="text-champagne" />
            <span>Curated Wardrobe</span>
          </div>
          <h2 id="category-title" className="section-title mt-4 font-display text-4xl md:text-5xl lg:text-6xl text-ivory">
            Shop by Category
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-ivory/75 md:text-base">
            Explore our complete women&apos;s fashion collection — handcrafted silhouettes, signature tailored blazers, and luxury fabrics cut under one roof.
          </p>
        </header>

        {/* Categories Grid */}
        <ul className="no-scrollbar -mx-6 flex snap-x snap-mandatory gap-6 overflow-x-auto px-6 pb-4 md:mx-0 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible md:px-0 lg:grid-cols-6">
          {categories.map((c) => {
            const subtitle = CATEGORY_SUBTITLES[c.slug] || c.blurb;
            return (
              <li key={c.slug} className="snap-start">
                <Link
                  href={`/clothing/${c.slug}`}
                  className="group flex w-[140px] shrink-0 flex-col items-center gap-3.5 md:w-auto"
                >
                  {/* Photo Circle */}
                  <span className="relative grid h-[124px] w-[124px] place-items-center overflow-hidden rounded-full border-2 border-copper/40 shadow-card transition-all duration-500 group-hover:scale-105 group-hover:border-champagne group-hover:shadow-glow md:h-[144px] md:w-[144px]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={c.image || garmentArt(c.art, { width: 320 })}
                      alt={c.name}
                      loading="lazy"
                      className="absolute inset-0 h-full w-full object-cover opacity-95 transition-transform duration-700 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2.5 right-2.5 grid h-7 w-7 translate-y-2 place-items-center rounded-full bg-gradient-to-br from-copper to-champagne text-charcoal opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                      <ArrowRight size={13} strokeWidth={2.5} />
                    </span>
                  </span>

                  {/* Name and descriptive "what is it" below */}
                  <div className="flex flex-col items-center text-center">
                    <span className="font-display text-[15px] md:text-[16px] font-semibold uppercase tracking-[0.12em] text-ivory transition-colors group-hover:text-champagne">
                      {c.name}
                    </span>
                    <span className="mt-1 text-[11px] leading-tight text-champagne/80 tracking-wide">
                      {subtitle}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.24em] text-ivory/40 md:hidden">
          Swipe for more categories
        </p>
      </div>
    </section>
  );
}
