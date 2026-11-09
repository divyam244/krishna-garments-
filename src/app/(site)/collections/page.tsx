import type { Metadata } from "next";
import Link from "next/link";
import ProductCard from "@/components/product/ProductCard";
import { seasonalCollections } from "@/lib/navigation";
import { bannerArt } from "@/lib/art";
import { getAllProducts } from "@/lib/catalogue";

export const metadata: Metadata = {
  title: "Collections",
  description: "Seasonal collections from Krishna Garments — summer, winter, festive, wedding, everyday and party wear.",
};

export default async function CollectionsPage() {
  const products = await getAllProducts();

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <header className="mb-14 text-center">
        <p className="eyebrow mb-4">Made for the moment</p>
        <h1 className="section-title font-display text-4xl md:text-[56px]">Our Collections</h1>
        <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-ivory/55">
          Each collection is designed around how the season is actually worn — fabric weight first, then silhouette.
        </p>
      </header>

      <div className="flex flex-col gap-16">
        {seasonalCollections.map((c, idx) => {
          const inCollection = products.filter((p) => p.collectionSlug === c.slug);
          return (
            <section key={c.slug} aria-labelledby={`col-${c.slug}`} id={c.slug} className="scroll-mt-28">
              <div className="grid items-center gap-8 lg:grid-cols-[1fr_1.1fr]">
                <article className={`relative overflow-hidden rounded-xl border border-copper/25 shadow-card ${idx % 2 ? "lg:order-last" : ""}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={bannerArt(c.art, { width: 1000, ratio: 1.3 })} alt="" className="h-full w-full object-cover opacity-60" loading="lazy" />
                  <span className="absolute inset-0 bg-gradient-to-t from-charcoal via-charcoal/45 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7">
                    <h2 id={`col-${c.slug}`} className="font-display text-[34px] italic leading-none text-ivory md:text-[42px]">
                      {c.name}
                    </h2>
                    <p className="mt-3 max-w-md text-[13px] leading-relaxed text-ivory/65">{c.blurb}</p>
                  </div>
                </article>

                <div>
                  <div className="mb-5 flex items-baseline justify-between gap-4">
                    <p className="text-[11px] uppercase tracking-[0.2em] text-champagne/70">
                      {inCollection.length} piece{inCollection.length === 1 ? "" : "s"} available
                    </p>
                    <Link href={`/clothing?collection=${c.slug}`} className="text-[11px] uppercase tracking-[0.2em] text-champagne hover:text-ivory">
                      Shop all →
                    </Link>
                  </div>

                  {inCollection.length === 0 ? (
                    <div className="card-espresso p-6 text-sm leading-relaxed text-ivory/55">
                      This collection is stitched to order.{" "}
                      <Link href="/wholesale" className="text-champagne underline decoration-copper/50">
                        Send us an enquiry
                      </Link>{" "}
                      with your reference and quantity.
                    </div>
                  ) : (
                    <ul className="no-scrollbar -mx-6 flex gap-5 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible md:px-0">
                      {inCollection.slice(0, 3).map((p) => (
                        <li key={p.slug} className="shrink-0 [&>article]:w-[200px] md:[&>article]:w-full">
                          <ProductCard product={p} compact />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
