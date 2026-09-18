import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wipeOrders } from "@/lib/wipe-orders";
import { secureCompare } from "@/lib/secure-compare";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";
import { AppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

// Clears out test orders (and their payments/coupon usage) while leaving
// the catalog, categories, coupons, and customer accounts untouched -
// restocking reserved inventory and rolling back coupon usage counts
// first. Protected the same way as the other /api/setup/* endpoints:
// SETUP_SECRET plus an explicit confirm=WIPE, since this is destructive.
async function runWipe(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET is not configured" }, { status: 503 });
  }

  // Shared across every /api/setup/* endpoint (same "setup" key prefix) so
  // guesses can't be spread across routes to multiply the attempt budget -
  // these all gate destructive/admin-granting actions behind one secret.
  try {
    await enforceRateLimit(prisma, `setup:ip:${getClientIp(req)}`, { max: 5, windowMs: 15 * 60 * 1000 });
  } catch (err) {
    if (err instanceof AppError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  const provided = req.headers.get("x-setup-secret") || req.nextUrl.searchParams.get("secret");
  if (!secureCompare(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (req.nextUrl.searchParams.get("confirm") !== "WIPE") {
    return NextResponse.json(
      { error: "Add &confirm=WIPE to the URL to actually run this. This permanently deletes every order (restocking their items and rolling back coupon usage first) but leaves products, categories, coupons, and customer accounts untouched." },
      { status: 400 }
    );
  }

  try {
    const log = await wipeOrders(prisma);
    return NextResponse.json({ success: true, log });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Wipe failed" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return runWipe(req);
}

export async function POST(req: NextRequest) {
  return runWipe(req);
}
