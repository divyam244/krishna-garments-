import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import ScrollVideoHero from "./ScrollVideoHero";
import StaticHeroFallback from "./StaticHeroFallback";
import { loadHeroManifest } from "./load-manifest";
import { brand } from "@/lib/brand";

/**
 * Section 3 — Cinematic Hero.
 * The manifest is read on the server and passed down as a plain object so the
 * client component needs no extra fetch round-trip.
 */
export default async function Hero() {
  const manifest = await loadHeroManifest();

  if (!manifest) return <StaticHeroFallback />;

  // Copy appears per stage: minimal at the top, resolved by the brand reveal.
  return (
    <ScrollVideoHero manifest={manifest} scrollMultiplier={7}>
      <div className="flex flex-1 items-center">
        <div className="w-full px-6 pt-24 md:px-12 lg:px-20">
          <div className="max-w-xl animate-fadeUp">
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-champagne" />
              {brand.heroEyebrow}
            </p>

            <h1 className="font-display text-[clamp(2.9rem,8vw,6.2rem)] font-light leading-[0.94]">
              <span className="block text-ivory">{brand.heroTitle[0]}</span>
              <span className="block italic gold-text">{brand.heroTitle[1]}</span>
            </h1>

            <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/70 md:text-[15px]">
              {brand.heroLead}
            </p>

            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/clothing" className="btn-solid sheen">
                Shop Collection
                <ArrowRight size={16} />
              </Link>
              <Link href="/about#process" className="btn-outline backdrop-blur-sm">
                <Play size={14} fill="currentColor" />
                Watch the Making
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ScrollVideoHero>
  );
}
