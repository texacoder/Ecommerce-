import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyWebhookSignature } from "@/lib/razorpay";

type RazorpayWebhookPayload = {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        order_id: string;
        status: string;
        error_description?: string;
      };
    };
  };
};

/**
 * Server-to-server confirmation path recommended by Razorpay: even if the
 * customer's browser never returns to the client-side verify-payment call
 * (closed tab, network drop), this webhook is the authoritative record of
 * what actually happened to the payment. Configure this URL in the Razorpay
 * dashboard as https://<your-domain>/api/payments/webhook.
 */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("x-razorpay-signature");
  const rawBody = await req.text();

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  let body: RazorpayWebhookPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const paymentEntity = body.payload?.payment?.entity;
  if (!paymentEntity) {
    // Event we don't act on (e.g. refund.processed handled elsewhere) — ack it.
    return NextResponse.json({ ok: true });
  }

  const payment = await prisma.payment.findUnique({ where: { providerOrderId: paymentEntity.order_id } });
  if (!payment) return NextResponse.json({ ok: true });

  if (body.event === "payment.captured" && payment.status !== "PAID") {
    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: payment.id },
        data: { status: "PAID", providerPaymentId: paymentEntity.id },
      });
      const order = await tx.order.findUnique({ where: { id: payment.orderId } });
      if (order && order.paymentStatus !== "PAID") {
        await tx.order.update({
          where: { id: order.id },
          data: { paymentStatus: "PAID", status: order.status === "PENDING" ? "CONFIRMED" : order.status },
        });
      }
    });
  } else if (body.event === "payment.failed" && payment.status !== "PAID") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED", failureReason: paymentEntity.error_description ?? "Payment failed" },
    });
    await prisma.order.updateMany({
      where: { id: payment.orderId, paymentStatus: "PENDING" },
      data: { paymentStatus: "FAILED" },
    });
  }

  return NextResponse.json({ ok: true });
}
