import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wipeOrders } from "@/lib/wipe-orders";
import { secureCompare } from "@/lib/secure-compare";

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
