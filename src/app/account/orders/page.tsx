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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-xl font-semibold mb-6">My orders</h1>
      {orders.length === 0 && <p className="text-black/60 dark:text-white/60">You haven&apos;t placed any orders yet.</p>}
      <div className="flex flex-col gap-3">
        {orders.map((o) => (
          <Link key={o.id} href={`/account/orders/${o.id}`} className="border border-black/10 dark:border-white/10 rounded-lg p-4 flex justify-between items-center hover:bg-black/5 dark:hover:bg-white/10">
            <div>
              <p className="font-medium">#{o.orderNumber}</p>
              <p className="text-sm text-black/50 dark:text-white/50">
                {formatDate(o.createdAt)} · {o.items.length} item(s)
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{formatMoney(o.total)}</p>
              <p className="text-sm text-black/50 dark:text-white/50">{statusLabel(o.status)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
