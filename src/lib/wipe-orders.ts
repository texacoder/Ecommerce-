import type { PrismaClient } from "@prisma/client";

/**
 * Deletes every order (and their items/payments/coupon usage via cascade) -
 * but, unlike wipeDemoData, leaves products, categories, coupons, and
 * customer accounts untouched. For clearing out test purchases made while
 * verifying checkout, without losing a real catalog already built up.
 *
 * Restocks any order that still had stock reserved, and rolls back each
 * used coupon's usedCount, so deleting test orders doesn't leave inventory
 * or coupon limits permanently wrong.
 */
export async function wipeOrders(prisma: PrismaClient) {
  const log: string[] = [];

  const orders = await prisma.order.findMany({
    where: { stockReserved: true },
    include: { items: true },
  });
  for (const order of orders) {
    for (const item of order.items) {
      if (item.variantId) {
        await prisma.productVariant
          .update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
          .catch(() => null);
      } else if (item.productId) {
        await prisma.product
          .update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
          .catch(() => null);
      }
    }
  }
  log.push(`Restocked items from ${orders.length} order(s) that still had stock reserved.`);

  const usageCounts = await prisma.couponUsage.groupBy({
    by: ["couponId"],
    _count: { _all: true },
  });
  for (const { couponId, _count } of usageCounts) {
    await prisma.coupon.update({
      where: { id: couponId },
      data: { usedCount: { decrement: _count._all } },
    });
  }
  log.push(`Rolled back usage counts for ${usageCounts.length} coupon(s).`);

  const deleted = await prisma.order.deleteMany({});
  log.push(`Deleted ${deleted.count} order(s) (and their items/payments/coupon usage).`);

  log.push("Done. Products, categories, coupons, and customer accounts are untouched.");
  return log;
}
