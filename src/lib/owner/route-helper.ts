import "server-only";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireOwner, logAudit, UnauthorizedError, getCurrentOwner } from "@/lib/auth/session";

/** Wraps an owner-only handler: auth check + JSON validation + audit trail. */
export function ownerRoute<T extends z.ZodTypeAny>(
  schema: T,
  handler: (input: z.infer<T>, req: Request, owner: NonNullable<Awaited<ReturnType<typeof getCurrentOwner>>>) => Promise<Response>,
) {
  return async (req: Request) => {
    let owner;
    try {
      owner = await requireOwner();
    } catch (e) {
      if (e instanceof UnauthorizedError) {
        return NextResponse.json({ error: "Authentication required." }, { status: 401 });
      }
      throw e;
    }

    const parsed = schema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: parsed.error.issues[0]?.message ?? "Invalid input.",
          fields: Object.fromEntries(parsed.error.issues.map((i) => [String(i.path[0] ?? "_"), i.message])),
        },
        { status: 422 },
      );
    }

    try {
      return await handler(parsed.data, req, owner);
    } catch (e) {
      console.error("[owner api]", (e as Error).message);
      return NextResponse.json({ error: "That change could not be saved." }, { status: 500 });
    }
  };
}

export async function audit(userId: string | null, action: string, entity: string, entityId?: string | null) {
  await logAudit({ userId, action, entity, entityId });
}
