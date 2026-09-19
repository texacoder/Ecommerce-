import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wipeDemoData } from "@/lib/wipe-demo-data";
import { secureCompare } from "@/lib/secure-compare";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

// One-time pre-launch cleanup: wipes every product, category, coupon,
// promotion, order, review, and customer account, leaving only the admin
// account(s). Protected by SETUP_SECRET (same lever as the seed endpoint)
// plus a separate, explicit confirm=WIPE body field. POST-only, secret via
// header only - no GET, no secret-in-query-string. A GET with the secret
// and confirm baked into the URL fires the instant that URL is resolved
// (browser address bar, search suggestions, a prefetch, proxy/browser
// history) with no confirmation step, which is exactly how this endpoint
// previously got triggered by accident. Requiring an explicit POST with
// the secret as a header means it can only be triggered by a deliberate
// authenticated request (e.g. curl), never by a URL alone.
export async function POST(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET is not configured" }, { status: 503 });
  }

  // Shared across every /api/setup/* endpoint - see wipe-orders for why.
  try {
    await enforceRateLimit(prisma, `setup:ip:${getClientIp(req)}`, { max: 5, windowMs: 15 * 60 * 1000 });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const provided = req.headers.get("x-setup-secret");
  if (!secureCompare(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.confirm !== "WIPE") {
    return NextResponse.json(
      { error: 'Pass {"confirm":"WIPE"} in the request body to actually run this. This permanently deletes all products, categories, coupons, promotions, orders, reviews, and customer accounts.' },
      { status: 400 }
    );
  }

  try {
    const log = await wipeDemoData(prisma);
    return NextResponse.json({ success: true, log });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Wipe failed" },
      { status: 500 }
    );
  }
}
