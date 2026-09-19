import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getRazorpayClient } from "@/lib/razorpay";
import { sendOrderRefundedEmail } from "@/lib/order-emails";

const schema = z.object({ amount: z.number().int().min(1).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json().catch(() => ({})));

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "PARTIALLY_REFUNDED") {
      return NextResponse.json({ error: "Only paid orders can be refunded" }, { status: 400 });
    }

    const remaining = order.total - order.refundedAmount;
    const amount = body.amount ?? remaining;
    if (amount <= 0 || amount > remaining) {
      return NextResponse.json({ error: "Invalid refund amount" }, { status: 400 });
    }

    const paidPayment = await prisma.payment.findFirst({
      where: { orderId: order.id, status: "PAID" },
      orderBy: { createdAt: "desc" },
    });

    const razorpay = getRazorpayClient();
    let gatewayProcessed = false;

    if (razorpay && paidPayment?.providerPaymentId) {
      try {
        await razorpay.payments.refund(paidPayment.providerPaymentId, { amount });
        gatewayProcessed = true;
      } catch (gatewayErr) {
        const message = gatewayErr instanceof Error ? gatewayErr.message : "Razorpay refund failed";
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }
    // When no payment gateway is configured (or there's no matching PAID
    // payment record to refund through it), the refund is still recorded
    // in the database so the order's financials and status stay consistent
    // — but the admin is told plainly that no money was actually returned
    // via a gateway, so they know to process it manually.

    const newRefundedAmount = order.refundedAmount + amount;
    const fullyRefunded = newRefundedAmount >= order.total;

    // Guard against two concurrent refund requests (e.g. an admin
    // double-clicking) both reading the same stale refundedAmount and
    // together refunding more than the order total. The where clause only
    // matches if refundedAmount is still what we read above; a concurrent
    // request that already applied its own refund makes this a no-op match
    // failure instead of silently stacking amounts.
    const { count } = await prisma.order.updateMany({
      where: { id, refundedAmount: order.refundedAmount },
      data: {
        refundedAmount: newRefundedAmount,
        paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
        status: fullyRefunded ? "REFUNDED" : order.status,
      },
    });
    if (count === 0) {
      return NextResponse.json(
        { error: "This order's refund status just changed — please refresh and try again." },
        { status: 409 }
      );
    }

    const updated = await prisma.order.findUniqueOrThrow({
      where: { id },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });

    await sendOrderRefundedEmail(updated, updated.user.email, amount, fullyRefunded);

    return NextResponse.json({
      order: updated,
      gatewayProcessed,
      message: gatewayProcessed
        ? "Refund processed through Razorpay."
        : "No payment gateway configured (or no matching payment to refund) — the refund was only recorded in the order. Process the actual money return manually.",
    });
  } catch (err) {
    return errorResponse(err);
  }
}
