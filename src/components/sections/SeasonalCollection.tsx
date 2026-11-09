import Link from "next/link";
import { ArrowRight, Snowflake, Flame, Sun, Gem, ShoppingBag, Crown } from "lucide-react";
import InfiniteMarquee from "@/components/carousel/InfiniteMarquee";
import { seasonalCollections } from "@/lib/navigation";
import { bannerArt } from "@/lib/art";

const ICONS = { snowflake: Snowflake, flame: Flame, sun: Sun, ring: Gem, bag: ShoppingBag, crown: Crown };

/** Section 6 — Seasonal Collection, travelling RIGHT → LEFT (opposite of New Arrivals). */
export default function SeasonalCollection() {
  return (
    <section aria-labelledby="seasonal-title" className="relative overflow-hidden border-y border-copper/15 bg-deep/40 py-20 md:py-24">
      <div className="pointer-events-none absolute inset-0 bg-vignette" />

      <div className="mx-auto mb-10 flex max-w-[1600px] items-end justify-between gap-6 px-6 md:px-10">
        <div>
          <p className="eyebrow mb-3">Made for the moment</p>
          <h2 id="seasonal-title" className="font-display text-4xl leading-none md:text-5xl">
            Seasonal Collection
          </h2>
        </div>
        <Link
          href="/collections"
          className="group flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-champagne hover:text-ivory"
        >
          Explore All
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      {/* Independent speed and opposite direction — deliberately not synced with New Arrivals. */}
      <InfiniteMarquee
        direction="right-to-left"
        speed={68}
        ariaLabel="Seasonal collections, moving right to left"
      >
        {seasonalCollections.map((c) => {
          const Icon = ICONS[c.icon];
          return (
            <article
              key={c.slug}
              className="group relative flex h-[330px] w-[300px] shrink-0 overflow-hidden rounded-xl border border-copper/25 shadow-card transition-all duration-500 hover:border-copper/70 hover:shadow-glow sm:h-[380px] sm:w-[420px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.image || bannerArt(c.art, { width: 900, ratio: 1.15 })}
                alt={c.name}
                loading="lazy"
                className="absolute inset-0 h-full w-full object-cover opacity-75 transition-all duration-[1100ms] group-hover:scale-105 group-hover:opacity-90"
              />
              <span className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-charcoal/25" />

              <div className="relative flex h-full w-full flex-col justify-end gap-3 p-7">
                <Icon size={22} strokeWidth={1.4} className="text-champagne" />
                <h3 className="max-w-[16ch] font-display text-[30px] italic leading-[1.02] text-ivory md:text-[34px]">
                  {c.name.replace(" Collection", "")}
                  <span className="block not-italic text-[22px] tracking-tight text-champagne md:text-[26px]">
                    Collection
                  </span>
                </h3>
                <p className="max-w-[34ch] text-[13px] leading-relaxed text-ivory/60">{c.blurb}</p>
                <Link
                  href={`/collections/${c.slug}`}
                  className="mt-2 inline-flex w-fit items-center gap-2 rounded-sm border border-copper/60 px-4 py-2 text-[10px] uppercase tracking-[0.2em] text-champagne transition-all hover:bg-copper hover:text-charcoal"
                >
                  Explore <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          );
        })}
      </InfiniteMarquee>
    </section>
  );
}
