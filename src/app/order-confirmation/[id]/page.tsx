import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, statusLabel } from "@/lib/format";
import OrderStatusTimeline from "@/components/OrderStatusTimeline";
import OrderPaymentActions from "@/components/OrderPaymentActions";
import type { OrderStatus } from "@/lib/orders";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/order-confirmation/${id}`);

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || (order.userId !== session.sub && session.role !== "ADMIN")) {
    redirect("/account/orders");
  }

  const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED" || order.paymentStatus === "REFUNDED";
  const isFailedOrPending = order.paymentStatus === "PENDING" || order.paymentStatus === "FAILED";

  return (
    <div className="container-page py-12 max-w-2xl">
      {isPaid ? (
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[var(--success)] text-white flex items-center justify-center text-2xl mx-auto mb-3">✓</div>
          <h1 className="text-2xl font-semibold mb-1">Order placed successfully!</h1>
          <p className="text-[var(--text-muted)]">Order #{order.orderNumber}</p>
        </div>
      ) : order.paymentStatus === "FAILED" ? (
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[var(--danger)] text-white flex items-center justify-center text-2xl mx-auto mb-3">!</div>
          <h1 className="text-2xl font-semibold mb-1">Payment failed</h1>
          <p className="text-[var(--text-muted)]">Order #{order.orderNumber} — your items are still reserved.</p>
        </div>
      ) : (
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-full bg-[var(--warning)] text-white flex items-center justify-center text-2xl mx-auto mb-3">⏳</div>
          <h1 className="text-2xl font-semibold mb-1">Payment pending</h1>
          <p className="text-[var(--text-muted)]">Order #{order.orderNumber} has been created but not paid yet.</p>
        </div>
      )}

      {isFailedOrPending && (
        <div className="card-surface p-5 mb-6">
          <OrderPaymentActions orderId={order.id} total={order.total} currency={order.currency} />
        </div>
      )}

      {isPaid && (
        <div className="card-surface p-5 mb-6">
          <OrderStatusTimeline status={order.status as OrderStatus} />
        </div>
      )}

      <div className="card-surface p-5">
        <h2 className="font-semibold mb-3">Order details</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-[var(--border-subtle)] last:border-0">
            <span>
              {item.nameSnapshot} × {item.quantity}
            </span>
            <span>{formatMoney(item.priceSnapshot * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-3 mt-2 border-t border-[var(--border-subtle)]">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
        <p className="text-sm text-[var(--text-muted)] mt-2">Payment status: {statusLabel(order.paymentStatus)}</p>
      </div>

      <Link href="/account/orders" className="inline-block mt-6 text-sm text-[var(--brand-accent)] hover:underline">
        View all my orders
      </Link>
    </div>
  );
}
