import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  message: z.string().trim().min(1).max(1000),
  source: z.enum(["site", "maintenance"]).optional(),
});

const ONE_HOUR = 60 * 60 * 1000;

// Public, unauthenticated, anonymous by design - no name/email captured.
// Rate-limited by IP since anyone on the internet can reach it without
// logging in first.
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    await enforceRateLimit(prisma, `suggestion:ip:${getClientIp(req)}`, { max: 5, windowMs: ONE_HOUR });
    await prisma.suggestion.create({ data: { message: body.message, source: body.source ?? "site" } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
