import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import FilterBar, { type Facets } from "@/components/product/FilterBar";
import ProductCard from "@/components/product/ProductCard";
import EmptyState from "@/components/ui/EmptyState";
import { filterProducts, getFacets, getAllProducts } from "@/lib/catalogue";
import { categories } from "@/lib/navigation";
import { titleCase } from "@/lib/format";

export const metadata: Metadata = {
  title: "Clothing",
  description:
    "Shop Krishna Garments women's clothing — co-ord sets, jackets, kurtis, dresses, jeans and ethnic wear. Filter by size, colour, collection and price.",
};

type Search = Record<string, string | undefined>;

export default async function ClothingPage({
  params,
  searchParams,
}: {
  params: Promise<{ category?: string }>;
  searchParams: Promise<Search>;
}) {
  const [{ category }, sp] = await Promise.all([params, searchParams]);
  const [items, facets] = await Promise.all([
    filterProducts({
      category: category ?? sp.category,
      size: sp.size,
      colour: sp.colour,
      collection: sp.collection,
      availability: sp.availability,
      tag: sp.tag,
      sale: sp.sale === "1",
      q: sp.q,
      sort: (sp.sort as never) ?? "new",
      min: sp.min ? Number(sp.min) : undefined,
      max: sp.max ? Number(sp.max) : undefined,
    }),
    getFacets(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);
  const all = await getAllProducts();
  const usingSample = all.length > 0 && all.every((p) => p.isSample);

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      {/* Page header */}
      <header className="mb-8">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ivory/40">
          <Link href="/" className="hover:text-champagne">Home</Link>
          <span aria-hidden>/</span>
          <Link href="/clothing" className="hover:text-champagne">Clothing</Link>
          {activeCategory && (
            <>
              <span aria-hidden>/</span>
              <span className="text-champagne">{activeCategory.name}</span>
            </>
          )}
        </nav>

        <h1 className="font-display text-4xl leading-tight md:text-[54px]">
          {activeCategory ? activeCategory.name : sp.q ? `Search: “${sp.q}”` : sp.tag === "new" ? "New Arrivals" : sp.sale === "1" ? "Sale" : "All Clothing"}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ivory/55">
          {activeCategory?.blurb ??
            "Everything we currently make for women — cut, stitched, checked and packed under one roof."}
        </p>

        {usingSample && (
          <p className="sample-tag mt-4">
            Sample catalogue — no live database records yet. Prices are illustrative only.
          </p>
        )}
      </header>

      <Suspense fallback={<div className="h-14" />}>
        <FilterBar items={items} facets={facets as Facets} categories={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      </Suspense>

      {items.length === 0 ? (
        <EmptyState
          title="Nothing matches those filters"
          body="Try widening the price range or clearing a filter. We also stitch made-to-order — ask us for something specific."
          action={{ href: "/wholesale", label: "Make an Enquiry" }}
        />
      ) : (
        <ul className="mt-8 grid grid-cols-2 justify-items-center gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((p) => (
            <li key={p.slug} className="w-full max-w-[276px] [&>article]:w-full">
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      )}

      {/* Category cross-links */}
      <section aria-label="Other categories" className="mt-16 border-t border-copper/20 pt-8">
        <h2 className="label">More Categories</h2>
        <ul className="flex flex-wrap gap-x-6 gap-y-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={`/clothing/${c.slug}`}
                className={`text-[13px] hover:text-champagne ${category === c.slug ? "text-champagne" : "text-ivory/55"}`}
              >
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
