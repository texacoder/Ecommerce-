import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { wipeOrders } from "@/lib/wipe-orders";
import { errorResponse } from "@/lib/api";

// Same effect as the SETUP_SECRET-gated /api/setup/wipe-orders, but reached
// from inside the admin dashboard by an already-authenticated admin instead
// of a secret embedded in a URL - the SETUP_SECRET route exists for
// pre-launch bootstrapping when there's no admin session yet; once an admin
// is logged in, this is the safer everyday way to clear test orders.
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    if (body.confirm !== "WIPE") {
      return NextResponse.json(
        { error: 'Pass {"confirm":"WIPE"} in the request body to actually run this.' },
        { status: 400 }
      );
    }

    const log = await wipeOrders(prisma);
    return NextResponse.json({ success: true, log });
  } catch (err) {
    return errorResponse(err);
  }
}
