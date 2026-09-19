import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatDateTime, statusLabel } from "@/lib/format";
import OrderStatusTimeline from "@/components/OrderStatusTimeline";
import OrderPaymentActions from "@/components/OrderPaymentActions";
import ReturnItemControl from "@/components/ReturnItemControl";
import type { OrderStatus } from "@/lib/orders";
import { isReturnWindowOpen } from "@/lib/returns";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/account/orders/${id}`);

  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      items: { include: { product: { select: { isReturnable: true } }, returnRequest: true } },
    },
  });
  if (!order || (order.userId !== session.sub && session.role !== "ADMIN")) {
    redirect("/account/orders");
  }

  const isOwnOrder = order.userId === session.sub;
  const returnWindowOpen = isReturnWindowOpen(order.deliveredAt);

  const address = JSON.parse(order.addressSnapshot) as {
    fullName: string;
    line1: string;
    line2?: string | null;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    phone: string;
  };

  const isCod = order.paymentProvider === "cod";
  const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED" || order.paymentStatus === "REFUNDED";
  const isCancelledOrDone = order.status === "CANCELLED" || order.status === "REFUNDED";
  // A COD order sitting at paymentStatus PENDING is normal (cash isn't
  // collected until delivery) - it never needs the online "retry payment"
  // action an unpaid Razorpay order would.
  const isFailedOrPending = !isCod && (order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED") && !isCancelledOrDone;

  return (
    <div className="container-page py-10 max-w-3xl">
      <div className="flex items-start justify-between gap-4 mb-1">
        <h1 className="text-xl font-semibold">Order #{order.orderNumber}</h1>
        <Link
          href={`/customer-service?order=${order.orderNumber}`}
          className="text-sm text-[var(--brand-accent)] hover:underline shrink-0 whitespace-nowrap"
        >
          Need help?
        </Link>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-6">Placed {formatDateTime(order.createdAt)}</p>

      {isFailedOrPending && (
        <div className="card-surface p-4 mb-6">
          <OrderPaymentActions orderId={order.id} total={order.total} currency={order.currency} />
        </div>
      )}

      {(isPaid || isCod) && (
        <div className="card-surface p-4 mb-6">
          <OrderStatusTimeline status={order.status as OrderStatus} />
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="card-surface p-4">
          <h2 className="font-medium mb-2">Status</h2>
          <p>{statusLabel(order.status)}</p>
          {order.trackingNumber && (
            <p className="text-sm text-[var(--text-muted)] mt-1">
              Tracking: {order.trackingCarrier ?? ""} {order.trackingNumber}
            </p>
          )}
          <p className="text-sm text-[var(--text-muted)] mt-1">
            Payment: {isCod && order.paymentStatus === "PENDING" ? "Cash on Delivery" : statusLabel(order.paymentStatus)}
          </p>
        </div>
        <div className="card-surface p-4">
          <h2 className="font-medium mb-2">Delivery address</h2>
          <p className="text-sm">
            {address.fullName}
            <br />
            {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}
            <br />
            {address.city}, {address.state} — {address.postalCode}
            <br />
            {address.country} · {address.phone}
          </p>
        </div>
      </div>

      <div className="card-surface p-4">
        {order.items.map((item) => (
          <div key={item.id} className="py-1.5 border-b border-[var(--border-subtle)] last:border-0">
            <div className="flex justify-between text-sm">
              <span>
                {item.nameSnapshot} × {item.quantity}
              </span>
              <span>{formatMoney(item.priceSnapshot * item.quantity)}</span>
            </div>
            {isOwnOrder && order.status === "DELIVERED" && item.product?.isReturnable && (
              <ReturnItemControl
                orderId={order.id}
                itemId={item.id}
                returnWindowOpen={returnWindowOpen}
                existingRequest={item.returnRequest ? { status: item.returnRequest.status, reason: item.returnRequest.reason } : null}
              />
            )}
          </div>
        ))}
        <div className="flex flex-col gap-1 text-sm mt-3 pt-3 border-t border-[var(--border-subtle)]">
          <Row label="Subtotal" value={order.subtotal} />
          {order.discount > 0 && <Row label="Discount" value={-order.discount} />}
          <Row label="Shipping" value={order.shipping} />
          {order.tax > 0 && <Row label="Tax" value={order.tax} />}
          <Row label="Total" value={order.total} bold />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
