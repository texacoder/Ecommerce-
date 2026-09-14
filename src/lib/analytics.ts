import { prisma } from "@/lib/db";
import { LOW_STOCK_THRESHOLD } from "@/app/api/admin/inventory/route";

export async function getAnalyticsData() {
  const revenueOrders = await prisma.order.findMany({
    where: { status: { not: "CANCELLED" } },
    select: { total: true, createdAt: true },
  });
  const totalRevenue = revenueOrders.reduce((s, o) => s + o.total, 0);
  const orderCount = revenueOrders.length;
  const averageOrderValue = orderCount ? Math.round(totalRevenue / orderCount) : 0;

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const byDay = new Map<string, number>();
  for (const o of revenueOrders) {
    if (o.createdAt < thirtyDaysAgo) continue;
    const key = o.createdAt.toISOString().slice(0, 10);
    byDay.set(key, (byDay.get(key) ?? 0) + o.total);
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
  };
}
