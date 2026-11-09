// Seed script for the KRISHNA GARMENTS catalog (demo set: 15 products).
// All records are marked isSample: true so they can never be mistaken
// for real business data, and SAMPLE_DATA=true is required to run.

import { PrismaClient } from "@prisma/client";
import { categories } from "@/lib/navigation";

const prisma = new PrismaClient();

async function main() {
  const sampleDataFlag = process.env.SAMPLE_DATA === "true";
  if (!sampleDataFlag) {
    console.error(
      "SEED BLOCKED: SAMPLE_DATA must be set to true in .env to write sample records." +
      " Either set SAMPLE_DATA=true and rerun, or skip this script and create real data via the owner panel."
    );
    process.exit(1);
  }

  console.log("[seed] starting sample catalogue ...");

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        slug: cat.slug,
        name: cat.name,
        tagline: cat.blurb,
        sortOrder: 0,
        showInNav: true,
      },
    });
  }

  const products = [
    ["Embroidered Jacket", "jackets", "Textured crepe with gold-thread embroidery", 2999, 3599, ["S", "M", "L", "XL"], true, false, false, 32],
    ["Burgundy Co-ord Set", "coord-sets", "Premium rayon blend", 2499, 2899, ["XS", "S", "M", "L"], true, false, false, 58],
    ["Printed Kurti", "kurtis", "Hand-block printed cotton", 1899, null, ["S", "M", "L", "XL", "XXL"], true, false, false, 76],
    ["Denim Top", "tops", "13oz non-stretch denim", 1699, 1999, ["XS", "S", "M", "L"], true, false, false, 44],
    ["A-Line Dress", "dresses", "Flowing georgette", 2799, null, ["S", "M", "L", "XL"], true, false, false, 21],
    ["Black Cropped Co-ord", "coord-sets", "Structured suiting", 2999, null, ["XS", "S", "M", "L"], true, false, false, 18],
    ["Tailored Wool Blend Blazer", "jackets", "Wool-blend suiting, cupro lined", 4499, 5299, ["S", "M", "L", "XL"], false, false, false, 12],
    ["Silk Party Gown", "party-wear", "Mulberry silk", null, null, ["S", "M", "L"], false, false, true, 0],
    ["Everyday Cotton Shirt", "shirts", "Gauze cotton", 1299, null, ["XS", "S", "M", "L", "XL"], false, false, false, 140],
    ["Wide-Leg Trousers", "trousers", "Viscose twill", 1799, null, ["S", "M", "L", "XL"], false, false, false, 66],
    ["Pleated Midi Skirt", "skirts", "Accordion-pleat satin", 1599, 1899, ["XS", "S", "M", "L"], false, true, false, 39],
    ["Banarasi Saree Blouse", "ethnic-wear", "Silk-cotton with zari border", 2199, null, ["S", "M", "L", "XL"], false, false, false, 27],
    ["Slim Fit Jeans", "jeans", "12oz stretch denim", 2299, null, ["26", "28", "30", "32", "34"], false, false, false, 88],
    ["Relaxed Straight Jeans", "jeans", "Rigid 14oz denim", 2499, 2899, ["26", "28", "30", "32"], false, true, false, 51],
    ["Chikankari Kurti Set", "kurtis", "Chanderi with chikankari handwork", 3299, null, ["S", "M", "L", "XL"], true, false, false, 15],
  ] as Array<[string, string, string, number | null, number | null, string[], boolean, boolean, boolean, number]>;

  let created = 0;
  for (const [name, categorySlug, fabric, price, mrp, sizes, isNew, onSale, poq, stock] of products) {
    const categoryId = (await prisma.category.findUnique({ where: { slug: categorySlug } }))?.id;
    if (!categoryId) continue;

    const slug = (name as string).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const sku = "KG-SMP-" + String(created + 1).padStart(4, "0");
    const image = "https://krishna-garments-samples.s3.ap-south-1.amazonaws.com/demo/" + String(created + 1).padStart(4, "0") + ".webp";

    const stockVal = stock as number;
    let availability: "MADE_TO_ORDER" | "OUT_OF_STOCK" | "LOW_STOCK" | "IN_STOCK";
    if (poq) availability = "MADE_TO_ORDER";
    else if (stockVal <= 5) availability = "OUT_OF_STOCK";
    else if (stockVal <= 20) availability = "LOW_STOCK";
    else availability = "IN_STOCK";

    await prisma.product.upsert({
      where: { slug: slug },
      update: {},
      create: {
        sku,
        slug,
        name: name as string,
        description: "Our signature piece, cut and finished by hand at the Krishna Garments workshop. Priced for wholesale and production partners; enquire for volume and bespoke terms.",
        categoryId,
        fabric: fabric as string,
        price: price == null ? null : Number(price),
        mrp: mrp == null ? null : Number(mrp),
        currency: "INR",
        priceOnRequest: poq as boolean,
        availability: availability,
        sizes: sizes as string[],
        colours: [],
        stockOnHand: stockVal,
        minOrderQty: 1,
        isNewArrival: isNew as boolean,
        onSale: onSale as boolean,
        isFeatured: isNew as boolean,
        isSample: true,
        active: true,
        rating: null,
        images: [image],
      },
    });
    created++;
  }

  console.log("[seed] created", created, "sample product records (demo set).");
  console.log("[seed] run npm run db:seed again to verify idempotency (no duplicates).");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
