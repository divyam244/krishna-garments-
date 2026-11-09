import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { bannerArt } from "@/lib/art";
import { brand } from "@/lib/brand";

/**
 * Shown when frames have not been extracted yet (`npm run frames` pending).
 * Keeps the storefront complete and honest rather than rendering a broken hero.
 */
export default function StaticHeroFallback() {
  return (
    <section className="relative flex min-h-[92svh] items-center overflow-hidden bg-charcoal">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={bannerArt("tailoring", { width: 1600, ratio: 1.6 })}
        alt=""
        aria-hidden
        className="absolute inset-0 h-full w-full object-cover opacity-45"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/80 to-charcoal/30" />

      <div className="relative z-10 w-full px-6 pt-24 md:px-12 lg:px-20">
        <div className="max-w-xl animate-fadeUp">
          <p className="eyebrow mb-5 flex items-center gap-3">
            <span className="h-px w-10 bg-champagne" />
            {brand.heroEyebrow}
          </p>
          <h1 className="font-display text-[clamp(2.9rem,8vw,6rem)] font-light leading-[0.94]">
            <span className="block text-ivory">{brand.heroTitle[0]}</span>
            <span className="block italic gold-text">{brand.heroTitle[1]}</span>
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-ivory/70">{brand.heroLead}</p>
          <div className="mt-9 flex flex-wrap gap-4">
            <Link href="/clothing" className="btn-solid sheen">
              Shop Collection <ArrowRight size={16} />
            </Link>
            <Link href="/about#process" className="btn-outline">
              <Play size={14} fill="currentColor" /> Watch the Making
            </Link>
          </div>
        </div>

        <p className="mt-14 max-w-md rounded border border-copper/25 bg-deep/70 px-4 py-3 text-[11px] leading-relaxed text-ivory/55">
          Cinematic scroll animation is off — no frame sequence found. Run{" "}
          <code className="text-champagne">npm run frames</code> with <code className="text-champagne">HERO_VIDEO_PATH</code>{" "}
          set to your manufacturing video to enable it.
        </p>
      </div>
    </section>
  );
}
