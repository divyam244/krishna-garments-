import { NextResponse } from "next/server";
import { createHash } from "crypto";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";
import { getAllProducts } from "@/lib/catalogue";

const EnquirySchema = z.object({
  type: z.enum(["WHOLESALE", "BULK_ORDER", "CUSTOM_STITCHING", "MANUFACTURING", "GENERAL"]),
  name: z.string().trim().min(2, "Please enter your name").max(120),
  businessName: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z
    .string()
    .trim()
    .min(8, "Enter a valid phone number")
    .max(20, "Enter a valid phone number")
    .regex(/^[+0-9 ()\-.]+$/, "Phone may only contain digits and + ( ) -"),
  email: z.string().trim().email("Enter a valid email").max(160).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  products: z.string().trim().max(300).optional().or(z.literal("")),
  quantity: z.string().trim().max(80).optional().or(z.literal("")),
  message: z.string().trim().max(4000).optional().or(z.literal("")),
});

export async function POST(req: Request) {
  // Public write endpoint -> strict limit per IP.
  const ip = clientIp(req.headers);
  const rl = await checkRateLimit(`enquiry:${ip}`, 5, 10 * 60_000);
  if (!rl.ok) {
    return NextResponse.json(
      { error: `Too many enquiries. Please try again in ${rl.retryAfterSec} seconds.` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  const parsed = EnquirySchema.safeParse(body);
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      if (!fields[key]) fields[key] = issue.message;
    }
    return NextResponse.json({ error: "Please correct the highlighted fields.", fields }, { status: 422 });
  }

  const d = parsed.data;
  const reference = `KG-ENQ-${Date.now().toString(36).toUpperCase().slice(-6)}`;

  try {
    await db.enquiry.create({
      data: {
        reference,
        type: d.type,
        name: d.name,
        businessName: d.businessName || null,
        phone: d.phone,
        email: d.email || null,
        city: d.city || null,
        products: d.products || null,
        quantity: d.quantity || null,
        message: d.message || null,
        // Store only a hashed IP for abuse control, never the raw value.
        ipHash: createHash("sha256").update(ip).digest("hex").slice(0, 32),
      },
    });
  } catch (e) {
    console.error("[enquiries] persist failed:", (e as Error).message);
    return NextResponse.json(
      { error: "We could not save your enquiry right now. Please call or WhatsApp us instead." },
      { status: 503 },
    );
  }

  // Pre-fill a WhatsApp handoff when the business number is configured.
  const wa = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, "");
  const text = [
    `Krishna Garments enquiry ${reference}`,
    `${d.type.replace(/_/g, " ")} — ${d.name}${d.businessName ? ` (${d.businessName})` : ""}`,
    d.products ? `Products: ${d.products}` : "",
    d.quantity ? `Quantity: ${d.quantity}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return NextResponse.json({
    ok: true,
    reference,
    whatsappUrl: wa ? `https://wa.me/${wa}?text=${encodeURIComponent(text)}` : null,
  });
}

/** GET /api/enquiries/types — used by tests and the form to stay in sync. */
export async function GET() {
  const products = await getAllProducts();
  return NextResponse.json({
    types: EnquirySchema.shape.type.options,
    productCount: products.length,
  });
}
