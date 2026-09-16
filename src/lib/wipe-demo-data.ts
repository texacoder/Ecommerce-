import type { PrismaClient } from "@prisma/client";

/**
 * Deletes every product, category, coupon, promotion, order, review, and
 * customer account from the database — a full reset back to an empty
 * catalog before real launch. The admin account (and any other user with
 * role ADMIN) is never touched.
 *
 * Order matters here because of foreign key constraints: Orders reference
 * Users without cascading, so a customer with orders can't be deleted
 * until their orders are gone first; Category has a self-referencing
 * parent/child link that requires children to be removed before parents.
 */
export async function wipeDemoData(prisma: PrismaClient) {
  const log: string[] = [];

  const orders = await prisma.order.deleteMany({});
  log.push(`Deleted ${orders.count} orders (and their items/payments/coupon usage).`);

  const reviews = await prisma.review.deleteMany({});
  log.push(`Deleted ${reviews.count} reviews.`);

  const coupons = await prisma.coupon.deleteMany({});
  log.push(`Deleted ${coupons.count} coupons.`);

  const promotions = await prisma.promotion.deleteMany({});
  log.push(`Deleted ${promotions.count} promotions/banners.`);

  const products = await prisma.product.deleteMany({});
  log.push(`Deleted ${products.count} products (and their images/variants).`);

  const childCategories = await prisma.category.deleteMany({ where: { parentId: { not: null } } });
  const parentCategories = await prisma.category.deleteMany({});
  log.push(`Deleted ${childCategories.count + parentCategories.count} categories.`);

  const customers = await prisma.user.deleteMany({ where: { role: "CUSTOMER" } });
  log.push(`Deleted ${customers.count} customer accounts (and their addresses).`);

  log.push("Done. Only admin account(s) remain.");
  return log;
}
