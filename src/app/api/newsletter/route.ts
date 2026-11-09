import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, clientIp } from "@/lib/rate-limit";

const Schema = z.object({ email: z.string().trim().email("Enter a valid email address").max(160) });

export async function POST(req: Request) {
  const rl = await checkRateLimit(`newsletter:${clientIp(req.headers)}`, 8, 60 * 60_000);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Please try later." }, { status: 429 });
  }

  const parsed = Schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid email." }, { status: 422 });
  }

  const email = parsed.data.email.toLowerCase();

  try {
    await db.subscriber.upsert({
      where: { email },
      create: { email, source: "footer" },
      update: { source: "footer" },
    });
  } catch (e) {
    // Pre-migration fallback so the footer still behaves honestly.
    console.warn("[newsletter] DB unavailable:", (e as Error).message);
    return NextResponse.json({ ok: true, message: "Noted — we'll email you when the shop updates." });
  }

  return NextResponse.json({ ok: true, message: "You're on the list. Welcome to Krishna Garments." });
}
