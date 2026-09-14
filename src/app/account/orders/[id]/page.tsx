import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, formatDateTime, statusLabel } from "@/lib/format";
import OrderStatusTimeline from "@/components/OrderStatusTimeline";
import OrderPaymentActions from "@/components/OrderPaymentActions";
import type { OrderStatus } from "@/lib/orders";

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/account/orders/${id}`);

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || (order.userId !== session.sub && session.role !== "ADMIN")) {
    redirect("/account/orders");
  }

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

  const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED" || order.paymentStatus === "REFUNDED";
  const isFailedOrPending = order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED";

  return (
    <div className="container-page py-10 max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Order #{order.orderNumber}</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">Placed {formatDateTime(order.createdAt)}</p>

      {isFailedOrPending && (
        <div className="card-surface p-4 mb-6">
          <OrderPaymentActions orderId={order.id} total={order.total} currency={order.currency} />
        </div>
      )}

      {isPaid && (
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
          <p className="text-sm text-[var(--text-muted)] mt-1">Payment: {statusLabel(order.paymentStatus)}</p>
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
          <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-[var(--border-subtle)] last:border-0">
            <span>
              {item.nameSnapshot} × {item.quantity}
            </span>
            <span>{formatMoney(item.priceSnapshot * item.quantity)}</span>
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
