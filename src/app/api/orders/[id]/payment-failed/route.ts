import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  razorpay_order_id: z.string(),
  reason: z.string().max(500).optional(),
});

// Called by the client when the Razorpay widget reports a failure/cancel.
// The order stays PENDING with stock still reserved so the customer can
// retry — it is not silently marked paid, and it is not immediately
// cancelled either (that would drop their place in line for a slow retry).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = await prisma.payment.findUnique({ where: { providerOrderId: body.razorpay_order_id } });
    if (payment && payment.orderId === order.id) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: body.reason ?? "Payment failed or was cancelled" },
      });
    }

    if (order.paymentStatus === "PENDING") {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "FAILED" } });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
