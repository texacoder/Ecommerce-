import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getStripeClient } from "@/lib/stripe";

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

    const stripe = getStripeClient();
    if (stripe && order.paymentIntentId) {
      try {
        await stripe.refunds.create({ payment_intent: order.paymentIntentId, amount });
      } catch (stripeErr) {
        const message = stripeErr instanceof Error ? stripeErr.message : "Stripe refund failed";
        return NextResponse.json({ error: message }, { status: 502 });
      }
    }
    // When no payment provider is configured, the refund is still recorded
    // so the order's financials and status stay consistent.

    const newRefundedAmount = order.refundedAmount + amount;
    const fullyRefunded = newRefundedAmount >= order.total;

    const updated = await prisma.order.update({
      where: { id },
      data: {
        refundedAmount: newRefundedAmount,
        paymentStatus: fullyRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED",
        status: fullyRefunded ? "REFUNDED" : order.status,
      },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
