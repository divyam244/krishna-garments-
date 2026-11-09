import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import ProductCard from "@/components/product/ProductCard";
import Gallery from "@/components/product/Gallery";
import PurchasePanel from "@/components/product/PurchasePanel";
import EnquiryForm from "@/components/enquiry/EnquiryForm";
import { getProduct, getRelated } from "@/lib/catalogue";
import { categories } from "@/lib/navigation";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 155),
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const related = await getRelated(product, 5);
  const category = categories.find((c) => c.slug === product.categorySlug);

  return (
    <div className="mx-auto max-w-[1600px] px-6 pb-24 pt-28 md:px-10 md:pt-32">
      <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-ivory/40">
        <Link href="/" className="hover:text-champagne">Home</Link>
        <span aria-hidden>/</span>
        <Link href="/clothing" className="hover:text-champagne">Clothing</Link>
        <span aria-hidden>/</span>
        <Link href={`/clothing/${product.categorySlug}`} className="hover:text-champagne">
          {product.categoryName}
        </Link>
        <span aria-hidden>/</span>
        <span className="text-champagne">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <Gallery images={product.gallery} name={product.name} />

        <div className="flex flex-col gap-6">
          <header>
            <p className="eyebrow mb-3">{product.categoryName}</p>
            <h1 className="font-display text-[38px] leading-[1.05] md:text-[46px]">{product.name}</h1>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ivory/65">{product.description}</p>
          </header>

          <PurchasePanel product={product} />

          {/* Material / spec block — brief section 9 */}
          <dl className="grid grid-cols-2 gap-3 text-[13px]">
            <Detail term="Material" value={product.fabric} />
            <Detail term="SKU" value={product.sku} />
            <Detail term="Available sizes" value={product.sizes.join(" · ")} />
            <Detail term="Colours" value={product.colours.map((c) => c.name).join(" · ")} />
            <Detail term="Availability" value={availabilityCopy(product.availability, product.stockOnHand)} />
            <Detail term="Minimum order" value={`${product.minOrderQty} piece${product.minOrderQty > 1 ? "s" : ""}`} />
          </dl>

          {product.isSample && (
            <p className="sample-tag w-fit">
              Sample record — pricing and stock are illustrative until configured by the owner
            </p>
          )}

          <div className="hairline" />

          <details className="group rounded-lg border border-copper/25 bg-deep p-5">
            <summary className="cursor-pointer list-none text-[12px] uppercase tracking-[0.2em] text-champagne marker:hidden">
              Care &amp; delivery
            </summary>
            <ul className="mt-4 space-y-2 text-[13px] leading-relaxed text-ivory/60">
              <li>Dry clean recommended for embroidered and silk pieces; cottons may be machine washed cold.</li>
              <li>Dispatch in 2–4 working days for in-stock styles; made-to-order takes 3–5 weeks.</li>
              <li>Free shipping on retail orders above ₹999 across India.</li>
              <li>7-day hassle-free returns on unworn pieces with tags intact.</li>
            </ul>
          </details>
        </div>
      </div>

      {/* Wholesale enquiry anchored from card links */}
      <section id="enquiry" className="mt-20 scroll-mt-28 rounded-xl border border-copper/25 bg-deep/60 p-6 md:p-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr]">
          <div>
            <p className="eyebrow mb-3">Wholesale &amp; Bulk</p>
            <h2 className="font-display text-[30px] leading-tight md:text-[38px]">
              Order <span className="italic gold-text">{product.name}</span> in bulk
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-ivory/60">
              Tell us the quantity and destination and we will come back with lot pricing, MOQ slabs and a production
              slot. Custom colours and private labels are welcome on this style.
            </p>
            <ul className="mt-6 space-y-2 text-[13px] text-ivory/55">
              <li>· Current minimum order quantity: {product.minOrderQty} pieces</li>
              <li>· Sampling in 7–10 working days</li>
              <li>· Fabric sourced and stitching done in-house</li>
            </ul>
          </div>
          <EnquiryForm presetType="BULK_ORDER" presetProducts={product.name} compact />
        </div>
      </section>

      {/* Related products */}
      {related.length > 0 && (
        <section aria-labelledby="related-title" className="mt-20">
          <div className="mb-8 flex items-end justify-between gap-6">
            <h2 id="related-title" className="font-display text-3xl md:text-4xl">You may also like</h2>
            <Link
              href={`/clothing/${category?.slug ?? product.categorySlug}`}
              className="shrink-0 text-[11px] uppercase tracking-[0.2em] text-champagne hover:text-ivory"
            >
              All {product.categoryName} →
            </Link>
          </div>
          <ul className="no-scrollbar -mx-6 flex gap-5 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-5 md:gap-6 md:overflow-visible md:px-0">
            {related.map((p) => (
              <li key={p.slug} className="shrink-0 [&>article]:w-[200px] md:[&>article]:w-full">
                <ProductCard product={p} compact />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function Detail({ term, value }: { term: string; value: string }) {
  return (
    <div className="rounded border border-copper/20 bg-charcoal/50 p-3">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-ivory/42">{term}</dt>
      <dd className="mt-1 text-ivory/85">{value}</dd>
    </div>
  );
}

function availabilityCopy(a: string, stock: number): string {
  switch (a) {
    case "IN_STOCK":
      return `In stock (${stock} units)`;
    case "LOW_STOCK":
      return `Low stock (${stock} left)`;
    case "MADE_TO_ORDER":
      return "Made to order";
    default:
      return "Enquire for availability";
  }
}
