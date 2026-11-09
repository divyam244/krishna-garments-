import { cache } from "react";
import { db } from "@/lib/db";
import { categories, seasonalCollections } from "@/lib/navigation";
import { garmentArt, bannerArt, type ArtKind } from "@/lib/art";
import { slugify, titleCase } from "@/lib/format";

/**
 * Catalogue reads.
 *
 * The database is authoritative. If it has not been migrated yet (first-run
 * experience) we fall back to clearly-labelled SAMPLE_CATALOGUE so the site is
 * still fully navigable and every button does something real.
 */

export type Colour = { name: string; hex: string };
export type ProductView = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  description: string;
  categorySlug: string;
  categoryName: string;
  collectionSlug: string | null;
  price: number | null;
  mrp: number | null;
  priceOnRequest: boolean;
  sizes: string[];
  colours: Colour[];
  fabric: string;
  availability: string;
  stockOnHand: number;
  isNewArrival: boolean;
  onSale: boolean;
  minOrderQty: number;
  image: string;
  gallery: string[];
  rating: number | null;
  isSample: boolean;
};

export const SAMPLE_FLAG = "SAMPLE DATA — replace via owner dashboard";

const SWATCHES: Record<string, Colour[]> = {
  ivory: [{ name: "Ivory", hex: "#E9D9C5" }],
  warm: [
    { name: "Champagne", hex: "#D49A60" },
    { name: "Copper", hex: "#B87333" },
    { name: "Espresso", hex: "#302016" },
  ],
  rose: [
    { name: "Rosewood", hex: "#7E3F4B" },
    { name: "Blush", hex: "#D9A6A0" },
    { name: "Ivory", hex: "#E9D9C5" },
  ],
  denim: [
    { name: "Indigo", hex: "#3B5A78" },
    { name: "Stone Wash", hex: "#9BB2C6" },
    { name: "Ecru", hex: "#E3DACB" },
  ],
  night: [
    { name: "Charcoal", hex: "#1D1916" },
    { name: "Copper", hex: "#B87333" },
    { name: "Ivory", hex: "#E9D9C5" },
  ],
};

type SampleDef = {
  name: string;
  category: string;
  art: ArtKind;
  price: number | null;
  mrp?: number;
  sizes: string[];
  swatch: keyof typeof SWATCHES;
  fabric: string;
  desc: string;
  new?: boolean;
  sale?: boolean;
  poq?: boolean;
  stock?: number;
  collection?: string;
};

/**
 * Sample catalogue. Every entry is marked `isSample` and rendered with a
 * "sample data" ribbon in the UI so nothing here can be mistaken for a real
 * business record or an approved price.
 */
const S: SampleDef[] = [
  { name: "Embroidered Jacket", category: "jackets", art: "jacket", price: 2999, mrp: 3599, sizes: ["S", "M", "L", "XL"], swatch: "warm", fabric: "Textured crepe with gold-thread embroidery", desc: "Our signature tailored jacket, cut on a soft shoulder and finished with hand-guided floral embroidery across the front panel.", new: true, stock: 32 },
  { name: "Burgundy Co-ord Set", category: "coord-sets", art: "coord", price: 2499, mrp: 2899, sizes: ["XS", "S", "M", "L"], swatch: "rose", fabric: "Premium rayon blend", desc: "Shirt-and-trouser co-ord in deep burgundy, with mother-of-pearl buttons and a straight comfortable leg.", new: true, stock: 58 },
  { name: "Printed Kurti", category: "kurtis", art: "kurti", price: 1899, sizes: ["S", "M", "L", "XL", "XXL"], swatch: "ivory", fabric: "Hand-block printed cotton", desc: "A relaxed everyday kurti with side slits, mandarin collar and tonal thread work at the placket.", new: true, stock: 76 },
  { name: "Denim Top", category: "tops", art: "top", price: 1699, mrp: 1999, sizes: ["XS", "S", "M", "L"], swatch: "denim", fabric: "13oz non-stretch denim", desc: "Cropped denim top with a squared shoulder, front button closure and clean overlock finishing.", new: true, stock: 44 },
  { name: "A-Line Dress", category: "dresses", art: "dress", price: 2799, sizes: ["S", "M", "L", "XL"], swatch: "rose", fabric: "Flowing georgette", desc: "A softly gathered A-line midi dress with cap sleeves and a concealed back zip.", new: true, stock: 21 },
  { name: "Black Cropped Co-ord", category: "coord-sets", art: "coord", price: 2999, sizes: ["XS", "S", "M", "L"], swatch: "night", fabric: "Structured suiting", desc: "Sharp cropped jacket with matching high-waist trousers — built for evening wear that still feels like tailoring.", new: true, stock: 18 },
  { name: "Tailored Wool Blend Blazer", category: "jackets", art: "jacket", price: 4499, mrp: 5299, sizes: ["S", "M", "L", "XL"], swatch: "warm", fabric: "Wool-blend suiting, cupro lined", desc: "Fully lined single-breasted blazer with notch lapels, structured canvas chest and satin-lined sleeves.", stock: 12 },
  { name: "Silk Party Gown", category: "party-wear", art: "party", price: null, sizes: ["S", "M", "L"], swatch: "night", fabric: "Mulberry silk", desc: "Floor-length gown produced in limited runs. Wholesale and made-to-measure enquiries only.", poq: true, stock: 0 },
  { name: "Everyday Cotton Shirt", category: "shirts", art: "shirt", price: 1299, sizes: ["XS", "S", "M", "L", "XL"], swatch: "ivory", fabric: "Gauze cotton", desc: "Featherweight gauze cotton shirt with a curved hem — the piece that earns its place in the rotation.", stock: 140 },
  { name: "Wide-Leg Trousers", category: "trousers", art: "trouser", price: 1799, sizes: ["S", "M", "L", "XL"], swatch: "warm", fabric: "Viscose twill", desc: "High-rise wide-leg trousers with a flat front waistband and deep set pockets.", stock: 66 },
  { name: "Pleated Midi Skirt", category: "skirts", art: "skirt", price: 1599, mrp: 1899, sizes: ["XS", "S", "M", "L"], swatch: "rose", fabric: "Accordion-pleat satin", desc: "Knife-pleated midi skirt with an elasticated inner waistband for all-day comfort.", sale: true, stock: 39 },
  { name: "Banarasi Saree Blouse", category: "ethnic-wear", art: "ethnic", price: 2199, sizes: ["S", "M", "L", "XL"], swatch: "night", fabric: "Silk-cotton with zari border", desc: "Structured blouse patterned to support heavy zari sarees, with padded straps and hook closure.", stock: 27 },
  { name: "Slim Fit Jeans", category: "jeans", art: "jeans", price: 2299, sizes: ["26", "28", "30", "32", "34"], swatch: "denim", fabric: "12oz stretch denim", desc: "Mid-rise slim jeans with a contoured waistband and reinforced pocket bars.", stock: 88 },
  { name: "Relaxed Straight Jeans", category: "jeans", art: "jeans", price: 2499, mrp: 2899, sizes: ["26", "28", "30", "32"], swatch: "denim", fabric: "Rigid 14oz denim", desc: "Straight leg cut in rigid denim that breaks in to your shape over time.", sale: true, stock: 51 },
  { name: "Chikankari Kurti Set", category: "kurtis", art: "kurti", price: 3299, sizes: ["S", "M", "L", "XL"], swatch: "ivory", fabric: "Chanderi with chikankari handwork", desc: "Hand-embroidered chikankari kurta with palazzo and dupatta, three-piece set.", new: true, stock: 15 },
  { name: "Crystal Drop Earrings", category: "accessories", art: "accessory", price: 899, sizes: ["One Size"], swatch: "warm", fabric: "Brass with rhodium plating", desc: "Lightweight drop earrings finished in our workshop, plated to hold colour through wear.", stock: 210 },
  { name: "Sequin Party Dress", category: "party-wear", art: "party", price: 3899, sizes: ["S", "M", "L"], swatch: "night", fabric: "Sequinned net on viscose base", desc: "Fully sequinned shift dress with a lined bodice and invisible zip.", stock: 9 },
  { name: "Festive Sharara Set", category: "ethnic-wear", art: "ethnic", price: 4299, mrp: 4999, sizes: ["S", "M", "L", "XL"], swatch: "rose", fabric: "Brocade with gota detailing", desc: "Kurti, sharara and dupatta in a festive brocade, detailed with gota patti along every edge.", sale: true, stock: 11 },
  { name: "Linen Summer Dress", category: "dresses", art: "dress", price: 2599, sizes: ["XS", "S", "M", "L", "XL"], swatch: "ivory", fabric: "Pure washed linen", desc: "Sleeveless linen shirtdress with a self tie waist — cut generously to move in summer heat.", new: true, stock: 34 },
  { name: "Oversized Poplin Shirt", category: "shirts", art: "shirt", price: 1499, sizes: ["S", "M", "L"], swatch: "denim", fabric: "Crisp cotton poplin", desc: "Boyfriend-fit poplin shirt with dropped shoulders and a long tunic length.", stock: 72 },
  { name: "Velvet Wrap Top", category: "tops", art: "top", price: 1899, sizes: ["XS", "S", "M", "L"], swatch: "rose", fabric: "Stretch velvet", desc: "Wrap-style velvet top with a tie waist, made for festive layering.", stock: 29 },
  { name: "Structured Trench Coat", category: "jackets", art: "jacket", price: 5499, sizes: ["S", "M", "L", "XL"], swatch: "warm", fabric: "Water-repellent cotton twill", desc: "Double-breasted trench with storm flap, belt and raglan sleeve for layering room.", stock: 7 },
];

function buildSample(): ProductView[] {
  return S.map((d) => {
    const cat = categories.find((c) => c.slug === d.category)!;
    return {
      id: `sample-${slugify(d.name)}`,
      sku: `KG-SMP-${String(S.indexOf(d) + 1).padStart(4, "0")}`,
      slug: slugify(d.name),
      name: d.name,
      description: d.desc,
      categorySlug: d.category,
      categoryName: cat.name,
      collectionSlug: d.collection ?? guessCollection(d),
      price: d.price,
      mrp: d.mrp ?? null,
      priceOnRequest: Boolean(d.poq),
      sizes: d.sizes,
      colours: SWATCHES[d.swatch],
      fabric: d.fabric,
      availability: d.poq ? "MADE_TO_ORDER" : (d.stock ?? 0) > 30 ? "IN_STOCK" : "LOW_STOCK",
      stockOnHand: d.stock ?? 0,
      isNewArrival: Boolean(d.new),
      onSale: Boolean(d.sale),
      minOrderQty: d.poq ? 50 : 1,
      image: `/images/products/${slugify(d.name)}.webp`,
      gallery: [
        `/images/products/${slugify(d.name)}.webp`,
        `/images/products/${slugify(d.name)}-g1.webp`,
        `/images/products/${slugify(d.name)}-g2.webp`,
      ],
      rating: 4.5,
      isSample: true,
    };
  });
}

function guessCollection(d: SampleDef): string | null {
  if (d.category === "party-wear") return "party";
  if (d.category === "ethnic-wear") return "festive";
  if (/linen|summer/i.test(d.name)) return "summer";
  if (/wool|trench|velvet|winter/i.test(d.name)) return "winter";
  if (/everyday|cotton shirt|trouser|jeans/i.test(d.name)) return "everyday";
  if (/wedding/i.test(d.name)) return "wedding";
  return null;
}

const sampleCatalogue = buildSample();

// ------------------------------------------------------------------ Mapping ---

type Row = Awaited<ReturnType<typeof loadRows>>[number];

async function loadRows() {
  return db.product.findMany({
    where: { active: true },
    include: { category: true, collection: true },
    orderBy: { createdAt: "desc" },
  });
}

function mapRow(p: Row): ProductView {
  const asArray = <T,>(v: unknown, fallback: T[]): T[] =>
    Array.isArray(v) ? (v as T[]) : fallback;

  const coloursRaw = asArray<{ name?: string; hex?: string } | string>(p.colours, []);
  const colours: Colour[] = coloursRaw.map((c) =>
    typeof c === "string" ? { name: c, hex: "#B87333" } : { name: c.name ?? "", hex: c.hex ?? "#B87333" },
  );

  const gallery = asArray<string>(p.images, []);
  const kindFor = (slug: string): ArtKind =>
    (categories.find((c) => c.slug === slug)?.art as ArtKind) ?? "dress";

  return {
    id: p.id,
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    description: p.description,
    categorySlug: p.category.slug,
    categoryName: p.category.name,
    collectionSlug: p.collection?.slug ?? null,
    price: p.price == null ? null : Number(p.price),
    mrp: p.mrp == null ? null : Number(p.mrp),
    priceOnRequest: p.priceOnRequest,
    sizes: asArray<string>(p.sizes, ["S", "M", "L"]),
    colours: colours.length ? colours : SWATCHES.warm,
    fabric: p.fabric ?? "Premium woven fabric",
    availability: p.availability,
    stockOnHand: p.stockOnHand,
    isNewArrival: p.isNewArrival,
    onSale: p.onSale,
    minOrderQty: p.minOrderQty,
    image: gallery[0] ?? `/images/products/${p.slug}.webp`,
    gallery: gallery.length ? gallery : [`/images/products/${p.slug}.webp`],
    rating: p.rating == null ? null : Number(p.rating),
    isSample: p.isSample,
  };
}

// ------------------------------------------------------------------- Reads ----

/** True once the database has been migrated and seeded. Cached per request. */
export const catalogueReady = cache(async (): Promise<boolean> => {
  try {
    return (await db.product.count({ where: { active: true } })) > 0;
  } catch {
    return false;
  }
});

export const getAllProducts = cache(async (): Promise<ProductView[]> => {
  if (await catalogueReady()) {
    try {
      return (await loadRows()).map(mapRow);
    } catch (e) {
      console.warn("[catalogue] DB read failed, using sample:", (e as Error).message);
    }
  }
  return sampleCatalogue;
});

export type FilterQuery = {
  category?: string;
  size?: string;
  colour?: string;
  collection?: string;
  availability?: string;
  tag?: string;
  sale?: boolean;
  q?: string;
  sort?: "new" | "price-asc" | "price-desc" | "popular";
  min?: number;
  max?: number;
};

export async function filterProducts(q: FilterQuery): Promise<ProductView[]> {
  let items = await getAllProducts();

  if (q.category) items = items.filter((p) => p.categorySlug === q.category);
  if (q.collection) items = items.filter((p) => p.collectionSlug === q.collection);
  if (q.size) items = items.filter((p) => p.sizes.some((s) => s.toLowerCase() === q.size!.toLowerCase()));
  if (q.colour)
    items = items.filter((p) => p.colours.some((c) => c.name.toLowerCase().includes(q.colour!.toLowerCase())));
  if (q.availability) items = items.filter((p) => p.availability === q.availability);
  if (q.tag === "new") items = items.filter((p) => p.isNewArrival);
  if (q.sale) items = items.filter((p) => p.onSale);
  if (typeof q.min === "number") items = items.filter((p) => p.price != null && p.price >= q.min!);
  if (typeof q.max === "number") items = items.filter((p) => p.price != null && p.price <= q.max!);
  if (q.q) {
    const needle = q.q.toLowerCase();
    items = items.filter(
      (p) =>
        p.name.toLowerCase().includes(needle) ||
        p.categoryName.toLowerCase().includes(needle) ||
        p.description.toLowerCase().includes(needle),
    );
  }

  switch (q.sort) {
    case "price-asc":
      items = [...items].sort((a, b) => (a.price ?? 1e12) - (b.price ?? 1e12));
      break;
    case "price-desc":
      items = [...items].sort((a, b) => (b.price ?? -1) - (a.price ?? -1));
      break;
    case "popular":
      items = [...items].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
      break;
    default:
      items = [...items].sort((a, b) => Number(b.isNewArrival) - Number(a.isNewArrival));
  }

  return items;
}

export async function getProduct(slug: string): Promise<ProductView | null> {
  const items = await getAllProducts();
  return items.find((p) => p.slug === slug) ?? null;
}

export async function getRelated(product: ProductView, limit = 6): Promise<ProductView[]> {
  const all = await getAllProducts();
  const sameCategory = all.filter((p) => p.slug !== product.slug && p.categorySlug === product.categorySlug);
  const sameCollection = all.filter(
    (p) => p.slug !== product.slug && product.collectionSlug && p.collectionSlug === product.collectionSlug,
  );
  const filler = all.filter((p) => p.slug !== product.slug);
  const seen = new Set<string>();
  return [...sameCategory, ...sameCollection, ...filler]
    .filter((p) => (seen.has(p.slug) ? false : (seen.add(p.slug), true)))
    .slice(0, limit);
}

/** Facet values actually present in the catalogue, for filter dropdowns. */
export async function getFacets() {
  const items = await getAllProducts();
  const sizes = new Set<string>();
  const colours = new Set<string>();
  let min = Infinity;
  let max = 0;
  for (const p of items) {
    p.sizes.forEach((s) => sizes.add(s));
    p.colours.forEach((c) => colours.add(c.name));
    if (p.price != null) {
      min = Math.min(min, p.price);
      max = Math.max(max, p.price);
    }
  }
  return {
    sizes: [...sizes],
    colours: [...colours],
    collections: seasonalCollections.map((c) => ({ slug: c.slug, name: c.name })),
    availabilities: ["IN_STOCK", "LOW_STOCK", "MADE_TO_ORDER", "OUT_OF_STOCK"],
    priceMin: Number.isFinite(min) ? Math.floor(min) : 0,
    priceMax: max || 10000,
  };
}
