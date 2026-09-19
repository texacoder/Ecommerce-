import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { verifyPaymentSignature } from "@/lib/razorpay";
import { syncOrderToSheet } from "@/lib/google-sheets";
import { sendOrderConfirmedEmail } from "@/lib/order-emails";

const schema = z.object({
  razorpay_order_id: z.string(),
  razorpay_payment_id: z.string(),
  razorpay_signature: z.string(),
});

// Called by the client after Razorpay's checkout widget reports success.
// The signature is re-derived server-side from the key secret — this is the
// only thing that actually proves the payment happened, so nothing is
// marked PAID without it passing.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const payment = await prisma.payment.findUnique({
      where: { providerOrderId: body.razorpay_order_id },
    });
    if (!payment || payment.orderId !== order.id) {
      return NextResponse.json({ error: "Payment attempt not found for this order" }, { status: 404 });
    }

    const valid = verifyPaymentSignature({
      orderId: body.razorpay_order_id,
      paymentId: body.razorpay_payment_id,
      signature: body.razorpay_signature,
    });

    if (!valid) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "FAILED", failureReason: "Signature verification failed" },
      });
      return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
    }

    // This client-side callback and the webhook can both arrive for the
    // same payment (e.g. the webhook wins a race just before the browser
    // gets back to us). Gate the transition on an atomic updateMany rather
    // than a plain read-then-write, so only whichever request actually
    // flips PENDING/FAILED -> PAID gets to sync/email — the loser sees
    // count === 0 and skips both instead of double-sending.
    const { count } = await prisma.order.updateMany({
      where: { id: order.id, paymentStatus: { not: "PAID" } },
      data: { paymentStatus: "PAID", status: order.status === "PENDING" ? "CONFIRMED" : order.status },
    });

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: "PAID",
        providerPaymentId: body.razorpay_payment_id,
        signature: body.razorpay_signature,
      },
    });

    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { items: true } });

    // Awaited (not fire-and-forget) - a serverless function can be torn
    // down right after it returns a response, which would kill a detached
    // background fetch before it completes.
    if (count > 0) {
      await syncOrderToSheet(updated, user.email);
      await sendOrderConfirmedEmail(updated, user.email);
    }

    return NextResponse.json({ order: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
