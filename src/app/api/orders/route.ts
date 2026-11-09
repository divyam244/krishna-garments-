import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const Line = z.object({
  productId: z.string().min(1),
  name: z.string().min(1).max(160),
  size: z.string().max(24).default("Free"),
  colour: z.string().max(48).default(""),
  quantity: z.number().int().min(1).max(999),
  price: z.number().nonnegative().nullable(),
});

const Schema = z.object({ lines: z.array(Line).min(1, "Your bag is empty.").max(60) });

/**
 * Public order intake. Creates a PENDING order the owner then confirms in the
 * dashboard — we never fabricate payment status or stock deductions here.
 */
export async function POST(req: Request) {
  const rl = await checkRateLimit(`order:${clientIp(req.headers)}`, 10, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: `Too many orders from this device. Retry in ${rl.retryAfterSec}s.` }, { status: 429 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid cart." }, { status: 422 });
  }

  const lines = parsed.data.lines;
  const subtotal = lines.reduce((sum, l) => sum + (l.price ?? 0) * l.quantity, 0);

  try {
    const orderNo = `KG-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    const order = await db.order.create({
      data: {
        orderNo,
        customerName: "Website guest",
        channel: "ONLINE",
        status: "PENDING",
        paymentStatus: subtotal > 0 ? "UNPAID" : "PARTIAL",
        subtotal,
        total: subtotal,
        items: {
          create: lines.map((l) => ({
            productId: l.productId.startsWith("sample-") ? null : l.productId,
            label: l.name,
            size: l.size,
            colour: l.colour,
            unitPrice: l.price ?? 0,
            quantity: l.quantity,
            lineTotal: (l.price ?? 0) * l.quantity,
          })),
        },
      },
    });

    return NextResponse.json({ ok: true, orderNo, id: order.id, total: subtotal });
  } catch (e) {
    console.error("[orders] create failed:", (e as Error).message);
    return NextResponse.json(
      {
        error:
          "We could not record that order online right now. Your bag is saved — please send a wholesale enquiry and we will process it manually.",
      },
      { status: 503 },
    );
  }
}
