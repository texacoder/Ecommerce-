import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatMoney, statusLabel } from "@/lib/format";

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session) redirect(`/login?next=/order-confirmation/${id}`);

  const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!order || (order.userId !== session.sub && session.role !== "ADMIN")) {
    redirect("/account/orders");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-center">
      <h1 className="text-2xl font-semibold mb-2">Thank you for your order!</h1>
      <p className="text-black/60 dark:text-white/60 mb-8">Order #{order.orderNumber} — status: {statusLabel(order.status)}</p>

      <div className="border border-black/10 dark:border-white/10 rounded-lg p-4 text-left">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-black/5 dark:border-white/10 last:border-0">
            <span>
              {item.nameSnapshot} × {item.quantity}
            </span>
            <span>{formatMoney(item.priceSnapshot * item.quantity)}</span>
          </div>
        ))}
        <div className="flex justify-between font-semibold pt-3 mt-2 border-t border-black/10 dark:border-white/10">
          <span>Total</span>
          <span>{formatMoney(order.total)}</span>
        </div>
      </div>

      <Link href="/account/orders" className="inline-block mt-8 underline text-sm">
        View my orders
      </Link>
    </div>
  );
}
