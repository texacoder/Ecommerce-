import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getRazorpayClient, isRazorpayConfigured } from "@/lib/razorpay";

// Opens a fresh Razorpay order for an existing EXORASTORE order whose previous
// payment attempt failed or was abandoned. Stock stays reserved from the
// original checkout, so retrying never re-checks/re-decrements inventory.
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "This order was cancelled and can no longer be paid for" }, { status: 400 });
    }
    if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "FAILED") {
      return NextResponse.json({ error: "This order does not have a payment to retry" }, { status: 400 });
    }
    if (!isRazorpayConfigured()) {
      return NextResponse.json(
        { error: "Payment gateway is not configured in this environment." },
        { status: 503 }
      );
    }

    const razorpay = getRazorpayClient()!;
    const razorpayOrder = await razorpay.orders.create({
      amount: order.total,
      currency: order.currency,
      receipt: `${order.orderNumber}-retry-${Date.now()}`,
      notes: { orderId: order.id },
    });

    const payment = await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: "razorpay",
        providerOrderId: razorpayOrder.id,
        amount: order.total,
        currency: order.currency,
        status: "PENDING",
      },
    });

    if (order.paymentStatus === "FAILED") {
      await prisma.order.update({ where: { id: order.id }, data: { paymentStatus: "PENDING" } });
    }

    return NextResponse.json({
      payment,
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayOrderId: razorpayOrder.id,
    });
  } catch (err) {
    return errorResponse(err);
  }
}
