import Link from "next/link";
import { ArrowRight, Scissors, Ruler, Layers, BadgeCheck, Package } from "lucide-react";
import { bannerArt } from "@/lib/art";

/** Section 11 — brand story and process. */
const STEPS = [
  {
    icon: Layers,
    title: "Fabric Selection",
    body: "Greige goods are inspected roll by roll for GSM, colour fastness and hand feel before anything is cut.",
  },
  {
    icon: Scissors,
    title: "Skilled Craftsmanship",
    body: "Pattern masters lay and cut by hand, because a millimetre at the pattern stage becomes a bad fit at the shoulder.",
  },
  {
    icon: Ruler,
    title: "Precision Stitching",
    body: "Lockstitch, overlock and coverseam machines run to a per-style stitch-density sheet that every operator signs off.",
  },
  {
    icon: BadgeCheck,
    title: "Quality Checking",
    body: "Each garment passes measurement audits and seam-strength checks; rejects go back to the line, not into the carton.",
  },
  {
    icon: Package,
    title: "Finishing & Packaging",
    body: "Thread trimmed, steamed, folded and packed with tissue and size stickers, ready for retail hanger or wholesale carton.",
  },
];

export default function AboutStory() {
  return (
    <section id="process" aria-labelledby="story-title" className="relative overflow-hidden border-t border-copper/15 py-20 md:py-28">
      <div className="mx-auto max-w-[1600px] px-6 md:px-10">
        {/* Story header */}
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="eyebrow mb-4 flex items-center gap-3">
              <span className="h-px w-10 bg-champagne" /> Our Story
            </p>
            <h2 id="story-title" className="font-display text-4xl leading-[1.06] md:text-[52px]">
              The journey of fabric
              <span className="block italic gold-text">becoming a garment</span>
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-ivory/65">
              Krishna Garments began on a single cutting table. Today we design, sample and manufacture women&apos;s
              fashion under one roof — which means the person who chooses your fabric is accountable for the stitch
              that holds it together. No trading, no middlemen, no surprises between the swatch and the shipment.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/about" className="btn-solid sheen">
                Discover the Studio <ArrowRight size={15} />
              </Link>
              <Link href="/wholesale" className="btn-outline">
                Manufacturing Enquiry
              </Link>
            </div>
          </div>

          <figure className="relative overflow-hidden rounded-xl border border-copper/30 shadow-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={bannerArt("tailoring", { width: 1000, ratio: 1.25 })}
              alt="Tailor's mannequin in the Krishna Garments studio"
              loading="lazy"
              className="h-full w-full object-cover opacity-70"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-charcoal to-transparent p-6 pt-16">
              <p className="text-[11px] uppercase tracking-[0.24em] text-champagne">In-house sampling floor</p>
            </figcaption>
          </figure>
        </div>

        {/* Process rail */}
        <ol className="mt-20 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map((s, i) => (
            <li key={s.title} className="group relative">
              <article className="card-espresso flex h-full flex-col gap-3 p-6 transition-all duration-500 hover:border-copper/60 hover:bg-espresso">
                <span className="flex items-center justify-between">
                  <s.icon size={22} strokeWidth={1.4} className="text-copper transition-colors group-hover:text-champagne" />
                  <span className="font-display text-2xl text-copper/25 transition-colors group-hover:text-copper/45">
                    0{i + 1}
                  </span>
                </span>
                <h3 className="font-display text-[19px] leading-tight text-ivory">{s.title}</h3>
                <p className="text-[12.5px] leading-relaxed text-ivory/55">{s.body}</p>
              </article>
              {i < STEPS.length - 1 && (
                <span className="absolute -right-3 top-1/2 hidden h-px w-6 bg-gradient-to-r from-copper/60 to-transparent lg:block" />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
