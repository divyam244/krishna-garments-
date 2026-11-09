import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAllProducts } from "@/lib/catalogue";

/** Public read-only product feed, used by the search overlay. */
export async function GET() {
  const products = await getAllProducts();

  // If the DB is live, prefer its rows (already returned by getAllProducts).
  return NextResponse.json(
    products.map((p) => ({
      slug: p.slug,
      name: p.name,
      category: p.categoryName,
      image: p.image,
      price: p.price,
    })),
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
