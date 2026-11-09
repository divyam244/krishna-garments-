import { NextResponse } from "next/server";
import { destroyCurrentSession, getCurrentOwner } from "@/lib/auth/session";

export async function POST() {
  const owner = await getCurrentOwner();
  if (owner) await destroyCurrentSession();
  return NextResponse.json({ ok: true });
}
