import { prisma } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/app/api/admin/inventory/route";

const PAID_STATUSES: ("PAID" | "PARTIALLY_REFUNDED" | "REFUNDED")[] = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];

export async function getAnalyticsData() {
  // "Revenue" is real money actually collected (net of refunds) — orders
  // that are merely placed but still awaiting/failed payment don't count,
  // otherwise the dashboard would overstate what the business actually made.
  const paidOrders = await prisma.order.findMany({
    where: { paymentStatus: { in: PAID_STATUSES } },
    select: { total: true, refundedAmount: true, createdAt: true },
  });
  const totalRevenue = paidOrders.reduce((s, o) => s + (o.total - o.refundedAmount), 0);

  const allOrders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { id: true },
  });
  const orderCount = allOrders.length;
  const averageOrderValue = paidOrders.length ? Math.round(totalRevenue / paidOrders.length) : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const byDay = new Map<string, number>();
  for (const o of paidOrders) {
    if (o.createdAt < thirtyDaysAgo) continue;
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + (o.total - o.refundedAmount));
  }
  const revenueOverTime = Array.from(byDay.entries())
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, revenue]) => ({ date, revenue }));

  const customerCount = await prisma.user.count({ where: { role: "CUSTOMER" } });

  const soldItems = await prisma.orderItem.findMany({
    where: { order: { status: { not: "CANCELLED" } } },
    select: { productId: true, nameSnapshot: true, quantity: true },
  });
  const productsSold = soldItems.reduce((s, i) => s + i.quantity, 0);

  const salesByProduct = new Map<string, { name: string; quantity: number }>();
  for (const item of soldItems) {
    if (!item.productId) continue;
    const entry = salesByProduct.get(item.productId) ?? { name: item.nameSnapshot, quantity: 0 };
    entry.quantity += item.quantity;
    salesByProduct.set(item.productId, entry);
  }
  const bestSellers = Array.from(salesByProduct.entries())
    .map(([productId, v]) => ({ productId, ...v }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  const products = await prisma.product.findMany({
    where: { deletedAt: null },
    select: { id: true, name: true, sku: true, stock: true },
  });
  const lowStockProducts = products
    .filter((p) => p.stock <= LOW_STOCK_THRESHOLD)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 20);

  const pendingOrders = await prisma.order.count({ where: { status: "PENDING" } });

  const statusCounts = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const orderStatusDistribution = statusCounts.map((s) => ({ status: s.status, count: s._count._all }));

  return {
    totalRevenue,
    orderCount,
    averageOrderValue,
    customerCount,
    productsSold,
    revenueOverTime,
    bestSellers,
    lowStockProducts,
    pendingOrders,
    orderStatusDistribution,
  };
}
