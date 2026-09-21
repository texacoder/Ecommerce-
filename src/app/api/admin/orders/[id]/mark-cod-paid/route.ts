import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { syncOrderToSheet } from "@/lib/google-sheets";
import { sendMetaPurchaseEvent } from "@/lib/meta-capi";

// Cash on Delivery orders never go through Razorpay, so nothing ever marks
// them PAID automatically - this is that step, for once the admin has
// actually collected the cash (typically on/after delivery).
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id }, include: { user: { select: { email: true } } } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentProvider !== "cod") {
      return NextResponse.json({ error: "This isn't a Cash on Delivery order" }, { status: 400 });
    }
    if (order.paymentStatus !== "PENDING") {
      return NextResponse.json({ error: `Payment is already ${order.paymentStatus.toLowerCase()}` }, { status: 400 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { paymentStatus: "PAID" },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });

    // Same "paid order gets synced" semantics as the Razorpay webhook/verify
    // path - awaited, not fire-and-forget, for the same teardown reason.
    await syncOrderToSheet(updated, order.user.email);
    await sendMetaPurchaseEvent(updated, order.user.email);

    return NextResponse.json({ order: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
