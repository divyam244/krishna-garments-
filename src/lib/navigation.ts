/**
 * Navigation model shared by header, mobile drawer and footer.
 * All categories are women's fashion only, per brief section 7.
 */

export type NavItem = { label: string; href: string; badge?: "sale" | "new" };

export const primaryNav: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "New Arrivals", href: "/clothing?tag=new" },
  { label: "Clothing", href: "/clothing" },
  { label: "Dresses", href: "/clothing/dresses" },
  { label: "Co-ord Sets", href: "/clothing/coord-sets" },
  { label: "Tops", href: "/clothing/tops" },
  { label: "Jeans", href: "/clothing/jeans" },
  { label: "Accessories", href: "/clothing/accessories" },
  { label: "Sale", href: "/clothing?sale=1", badge: "sale" },
  { label: "About", href: "/about" },
];

export type CategoryDef = {
  name: string;
  slug: string;
  image?: string;
  art: import("@/lib/art").ArtKind;
  blurb: string;
};

/** The 12 shopping categories from brief section 7, in display order. */
export const categories: CategoryDef[] = [
  { name: "Co-ord Sets", slug: "coord-sets", image: "/images/categories/coord-sets.webp", art: "coord", blurb: "Matching two-piece sets in premium woven fabric." },
  { name: "Tops", slug: "tops", image: "/images/categories/tops.webp", art: "top", blurb: "Everyday tops, bodices and blouse essentials." },
  { name: "Jeans", slug: "jeans", image: "/images/categories/jeans.webp", art: "jeans", blurb: "Structured denim with a soft, wearable finish." },
  { name: "Dresses", slug: "dresses", image: "/images/categories/dresses.webp", art: "dress", blurb: "A-lines, shirt dresses and fluid midi silhouettes." },
  { name: "Women's Jackets", slug: "jackets", image: "/images/categories/jackets.webp", art: "jacket", blurb: "Tailored blazers — our signature make." },
  { name: "Kurtis", slug: "kurtis", image: "/images/categories/kurtis.webp", art: "kurti", blurb: "Contemporary kurtis with hand-finished detailing." },
  { name: "Shirts", slug: "shirts", image: "/images/categories/shirts.webp", art: "shirt", blurb: "Crisp shirting in cotton, linen and viscose." },
  { name: "Trousers", slug: "trousers", image: "/images/categories/trousers.webp", art: "trouser", blurb: "Wide-leg, cigarette and comfort-waist cuts." },
  { name: "Skirts", slug: "skirts", image: "/images/categories/skirts.webp", art: "skirt", blurb: "Pleated, wrap and flared skirt patterns." },
  { name: "Ethnic Wear", slug: "ethnic-wear", image: "/images/categories/ethnic-wear.webp", art: "ethnic", blurb: "Saree blouses, shararas and festive ensembles." },
  { name: "Party Wear", slug: "party-wear", image: "/images/categories/party-wear.webp", art: "party", blurb: "Statement pieces for evenings and occasions." },
  { name: "Accessories", slug: "accessories", image: "/images/categories/accessories.webp", art: "accessory", blurb: "Finishing touches to complete the look." },
];

export type CollectionDef = {
  name: string;
  slug: string;
  image?: string;
  art: import("@/lib/art").ArtKind;
  icon: "snowflake" | "flame" | "sun" | "ring" | "bag" | "crown";
  blurb: string;
};

/** Seasonal collections for the right-to-left showcase (brief section 6). */
export const seasonalCollections: CollectionDef[] = [
  { name: "Summer Collection", slug: "summer", image: "/images/collections/summer.webp", art: "dress", icon: "sun", blurb: "Breathable cottons and light prints built for long daylight hours." },
  { name: "Winter Collection", slug: "winter", image: "/images/collections/winter.webp", art: "jacket", icon: "snowflake", blurb: "Heavyweight weaves, lined jackets and warm layered tailoring." },
  { name: "Festive Collection", slug: "festive", image: "/images/collections/festive.webp", art: "ethnic", icon: "flame", blurb: "Rich textures and intricate detailing for the celebration season." },
  { name: "Wedding Collection", slug: "wedding", image: "/images/collections/wedding.webp", art: "party", icon: "ring", blurb: "Refined silhouettes for the bride's circle and every occasion either side." },
  { name: "Everyday Essentials", slug: "everyday", image: "/images/collections/everyday.webp", art: "coord", icon: "bag", blurb: "The dependable wardrobe — made to be worn, washed and repeated." },
  { name: "Party Wear", slug: "party", image: "/images/collections/party.webp", art: "party", icon: "crown", blurb: "Statement pieces cut to hold the room after dark." },
];

export const footerColumns: { title: string; links: NavItem[] }[] = [
  {
    title: "Shop",
    links: [
      { label: "New Arrivals", href: "/clothing?tag=new" },
      { label: "Co-ord Sets", href: "/clothing/coord-sets" },
      { label: "Tops", href: "/clothing/tops" },
      { label: "Jeans", href: "/clothing/jeans" },
      { label: "Dresses", href: "/clothing/dresses" },
      { label: "Accessories", href: "/clothing/accessories" },
      { label: "Sale", href: "/clothing?sale=1" },
    ],
  },
  {
    title: "Customer Support",
    links: [
      { label: "Track Order", href: "/support#track" },
      { label: "Shipping", href: "/support#shipping" },
      { label: "Returns", href: "/support#returns" },
      { label: "FAQs", href: "/support#faqs" },
      { label: "Contact Us", href: "/wholesale#contact" },
    ],
  },
  {
    title: "About",
    links: [
      { label: "Our Story", href: "/about#story" },
      { label: "Our Process", href: "/about#process" },
      { label: "Quality", href: "/about#quality" },
      { label: "Sustainability", href: "/about#sustainability" },
    ],
  },
];
