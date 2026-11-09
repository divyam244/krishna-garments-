import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

/** Public order tracking — exposes only status, date and item labels. */
export async function GET(req: Request) {
  const rl = await checkRateLimit(`track:${clientIp(req.headers)}`, 20, 60_000);
  if (!rl.ok) return NextResponse.json({ error: "Too many lookups." }, { status: 429 });

  const orderNo = new URL(req.url).searchParams.get("orderNo")?.trim().toUpperCase();
  if (!orderNo || orderNo.length < 4) {
    return NextResponse.json({ error: "Enter a valid order number." }, { status: 422 });
  }

  try {
    const order = await db.order.findUnique({
      where: { orderNo },
      include: { items: { select: { label: true, quantity: true } } },
    });
    if (!order) return NextResponse.json({ error: "Not found." }, { status: 404 });

    return NextResponse.json({
      orderNo: order.orderNo,
      status: order.status,
      total: Number(order.total),
      createdAt: order.createdAt,
      items: order.items.map((i: { label: string; quantity: number }) => `${i.label} × ${i.quantity}`),
    });
  } catch (e) {
    console.warn("[track] DB unavailable:", (e as Error).message);
    return NextResponse.json(
      { error: "Order records are not reachable yet. Please contact the desk directly." },
      { status: 503 },
    );
  }
}
