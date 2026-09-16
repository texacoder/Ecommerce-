import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { wipeDemoData } from "@/lib/wipe-demo-data";
import { secureCompare } from "@/lib/secure-compare";

export const dynamic = "force-dynamic";

// One-time pre-launch cleanup: wipes every product, category, coupon,
// promotion, order, review, and customer account, leaving only the admin
// account(s). Protected by SETUP_SECRET (same lever as the seed endpoint)
// plus a separate, explicit confirm=WIPE query param — deliberately not
// enough to trigger this by just visiting the URL with the secret alone,
// since this action is destructive and irreversible.
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
      { error: "Add &confirm=WIPE to the URL to actually run this. This permanently deletes all products, categories, coupons, promotions, orders, reviews, and customer accounts." },
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

export async function GET(req: NextRequest) {
  return runWipe(req);
}

export async function POST(req: NextRequest) {
  return runWipe(req);
}
