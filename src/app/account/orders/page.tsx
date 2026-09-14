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
      <h1 className="text-xl font-semibold mb-6">My Orders</h1>
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
              <p
                className={`text-sm ${
                  o.paymentStatus === "FAILED" || o.paymentStatus === "PENDING" ? "text-[var(--warning)] font-medium" : "text-[var(--text-muted)]"
                }`}
              >
                {o.paymentStatus === "PENDING" ? "Payment pending" : o.paymentStatus === "FAILED" ? "Payment failed" : statusLabel(o.status)}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
