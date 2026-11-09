import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Leaf, Award, Users, Factory } from "lucide-react";
import AboutStory from "@/components/sections/AboutStory";
import { bannerArt } from "@/lib/art";

export const metadata: Metadata = {
  title: "About",
  description:
    "The story of Krishna Garments — a women's fashion manufacturer that controls fabric selection, cutting, stitching, quality and finishing under one roof.",
};

const STATS = [
  { icon: Factory, value: "12,000", unit: "pieces / month", label: "Production capacity" },
  { icon: Users, value: "40+", unit: "artisans", label: "Cutting, sewing & finishing" },
  { icon: Award, value: "100%", unit: "checked", label: "Measurement audit per piece" },
  { icon: Leaf, value: "35%", unit: "offcut reuse", label: "Scrap into accessories" },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Cinematic opener */}
      <section id="story" className="relative flex min-h-[76svh] scroll-mt-24 items-center overflow-hidden border-b border-copper/20">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bannerArt("fabric", { width: 1800, ratio: 1.9 })} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover opacity-40" />
        <span className="absolute inset-0 bg-gradient-to-r from-charcoal via-charcoal/85 to-transparent" />

        <div className="relative mx-auto w-full max-w-[1600px] px-6 py-20 md:px-10">
          <div className="max-w-2xl">
            <p className="eyebrow mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-champagne" /> Established in the workshop
            </p>
            <h1 className="font-display text-[clamp(2.6rem,7vw,5rem)] leading-[1.02]">
              We make what we sell,
              <span className="block italic gold-text">and we sell what we make</span>
            </h1>
            <p className="mt-7 max-w-xl text-[15.5px] leading-relaxed text-ivory/65">
              Krishna Garments is a design-led garment manufacturer for women&apos;s fashion. Fabric arrives as a roll
              and leaves as a finished, labelled garment — every step between those two points happens inside our
              facility, which is why we can stand behind both the stitch count and the delivery date.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Link href="/clothing" className="btn-solid sheen">Shop the Collection <ArrowRight size={15} /></Link>
              <a href="#making" className="btn-outline">See how it is made</a>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section aria-label="Business at a glance" className="border-b border-copper/15 bg-deep/40">
        <ul className="mx-auto grid max-w-[1600px] gap-y-10 px-6 py-14 sm:grid-cols-2 md:px-10 lg:grid-cols-4">
          {STATS.map((s) => (
            <li key={s.label} className="flex items-start gap-4 px-2">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full border border-copper/40 text-copper">
                <s.icon size={19} strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-display text-[30px] leading-none text-champagne">
                  {s.value} <span className="text-[15px] text-ivory/45">{s.unit}</span>
                </p>
                <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] text-ivory/45">{s.label}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Reuse the process rail, anchored from the hero CTA */}
      <div id="making" className="scroll-mt-24">
        <AboutStory />
      </div>

      {/* Quality + sustainability */}
      <section className="mx-auto max-w-[1600px] px-6 pb-24 md:px-10">
        <div className="grid gap-6 lg:grid-cols-2">
          <article id="quality" className="card-espresso scroll-mt-28 p-8 md:p-10">
            <p className="eyebrow mb-4">Quality</p>
            <h2 className="font-display text-[30px] leading-tight md:text-[36px]">Four checks before a garment ships</h2>
            <ol className="mt-6 space-y-4 text-[13.5px] leading-relaxed text-ivory/62">
              {[
                ["Fabric inward", "GSM, shade band and colour-fastness tested against the approved standard."],
                ["Cut verification", "Panel counts and grain alignment checked against the marker plan."],
                ["In-line inspection", "Stitch density, seam strength and button pull tested on the line."],
                ["Final audit", "Measurement sheet signed off, then steamed, folded and packed."],
              ].map(([t, b], i) => (
                <li key={t} className="flex gap-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-copper/45 text-[11px] text-champagne">
                    {i + 1}
                  </span>
                  <span>
                    <strong className="block text-ivory/90">{t}</strong>
                    {b}
                  </span>
                </li>
              ))}
            </ol>
          </article>

          <article id="sustainability" className="card-espresso scroll-mt-28 p-8 md:p-10">
            <p className="eyebrow mb-4">Sustainability</p>
            <h2 className="font-display text-[30px] leading-tight md:text-[36px]">Offcuts are waste we can design out</h2>
            <p className="mt-5 text-[13.5px] leading-relaxed text-ivory/62">
              Marker planning is done to minimise fabric waste, and leftover panels go into scrunchies, tote linings and
              patch details rather than landfill. Water-based dyes are used where the hand feel allows it, and our
              packing cartons are reused through the wholesale network.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                "Zero-waste marker trials each season",
                "Offcuts recovered into accessories",
                "Reusable wholesale cartons",
                "Single-fibre styles for easier recycling",
              ].map((x) => (
                <li key={x} className="rounded border border-copper/20 bg-charcoal/40 px-3 py-2.5 text-[12.5px] text-ivory/70">
                  {x}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
