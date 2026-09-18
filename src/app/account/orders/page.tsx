import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";

export default async function OrdersPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account/orders");

  const orders = await prisma.order.findMany({
    where: { userId: session.sub },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="container-page py-10 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold">My Orders</h1>
        <Link href="/customer-service" className="text-sm text-[var(--brand-accent)] hover:underline">
          Need help?
        </Link>
      </div>
      {orders.length === 0 && (
        <div className="card-surface p-10 text-center">
          <p className="text-[var(--text-muted)] mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/products" className="btn-primary inline-block px-6 py-2.5 text-sm">
            Start Shopping
          </Link>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="card-surface p-4 flex justify-between items-center hover:shadow-md transition-shadow">
            <div>
              <p className="font-medium">#{o.orderNumber}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {formatDate(o.createdAt)} · {o.items.length} item(s)
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatMoney(o.total)}</p>
              <p className={`text-sm ${orderListLabelClass(o.status, o.paymentStatus)}`}>
                {orderListLabel(o.status, o.paymentStatus)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

// The order's own status always wins once it's reached a terminal state
// (cancelled/refunded) — "Payment pending" is otherwise-correct but
// misleading to keep showing on an order that's already cancelled, since
// no payment is coming for it anymore.
function orderListLabel(status: string, paymentStatus: string): string {
  if (status === "CANCELLED" || status === "REFUNDED") return statusLabel(status);
  if (paymentStatus === "PENDING") return "Payment pending";
  if (paymentStatus === "FAILED") return "Payment failed";
  return statusLabel(status);
}

function orderListLabelClass(status: string, paymentStatus: string): string {
  if (status === "CANCELLED" || status === "REFUNDED") return "text-[var(--text-muted)]";
  if (paymentStatus === "PENDING" || paymentStatus === "FAILED") return "text-[var(--warning)] font-medium";
  return "text-[var(--text-muted)]";
}
