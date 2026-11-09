import Link from "next/link";
import { ArrowRight } from "lucide-react";
import InfiniteMarquee from "@/components/carousel/InfiniteMarquee";
import ProductCard from "@/components/product/ProductCard";
import { getAllProducts } from "@/lib/catalogue";

/** Section 5 — New Arrivals, travelling LEFT → RIGHT. */
export default async function NewArrivals() {
  const products = await getAllProducts();
  const arrivals = products.filter((p) => p.isNewArrival);
  const list = (arrivals.length >= 6 ? arrivals : products).slice(0, 12);

  return (
    <section aria-labelledby="new-arrivals-title" className="relative overflow-hidden py-20 md:py-24">
      <div className="mx-auto mb-10 flex max-w-[1600px] items-end justify-between gap-6 px-6 md:px-10">
        <div>
          <p className="eyebrow mb-3">Just off the machine</p>
          <h2 id="new-arrivals-title" className="font-display text-4xl leading-none md:text-5xl">
            New Arrivals
          </h2>
        </div>
        <Link
          href="/clothing?tag=new"
          className="group flex shrink-0 items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-champagne hover:text-ivory"
        >
          View All
          <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
        </Link>
      </div>

      <InfiniteMarquee
        direction="left-to-right"
        speed={72}
        ariaLabel="New arrivals, moving left to right"
      >
        {list.map((p) => (
          <div key={p.slug}>
            <ProductCard product={p} compact />
          </div>
        ))}
      </InfiniteMarquee>

      {/* Mobile fallback hint: drag is native here, arrows are desktop-only */}
      <p className="mt-4 text-center text-[10px] uppercase tracking-[0.24em] text-ivory/30 md:hidden">
        Swipe to browse
      </p>
    </section>
  );
}
