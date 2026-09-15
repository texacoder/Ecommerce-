import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";

// Amounts everywhere are in paise (smallest INR unit), matching Razorpay.
// Listed product prices are treated as tax-inclusive (the common convention
// for Indian retail), so TAX_RATE is 0 by default — change it here if your
// catalog needs an explicit tax line.
export const TAX_RATE = 0;
export const FREE_SHIPPING_THRESHOLD = 49900; // ₹499
export const FLAT_SHIPPING = 4900; // ₹49

export type QuoteItemInput = { productId: string; variantId?: string | null; quantity: number };

export type QuoteLineItem = {
  productId: string;
  variantId: string | null;
  name: string;
  sku: string;
  image: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  availableStock: number;
};

export type Quote = {
  items: QuoteLineItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
};

export class PricingError extends AppError {}

/**
 * Recomputes the entire cart server-side from product/variant records in the
 * database. Nothing about price, stock, or discount is ever taken from the
 * client — this is the single source of truth used by both the checkout
 * preview and actual order creation, so totals can't be tampered with.
 */
export async function computeQuote(
  rawItems: QuoteItemInput[],
  couponCode: string | null | undefined,
  userId: string
): Promise<Quote> {
  if (!rawItems.length) throw new PricingError("Cart is empty");

  const items: QuoteLineItem[] = [];

  for (const raw of rawItems) {
    const quantity = Math.floor(Number(raw.quantity));
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new PricingError("Invalid quantity in cart");
    }

    const product = await prisma.product.findUnique({
      where: { id: raw.productId },
      include: { images: { orderBy: { position: "asc" }, take: 1 }, variants: true },
    });

    if (!product || product.deletedAt || product.status !== "PUBLISHED" || !product.visible) {
      throw new PricingError(`Product is no longer available`);
    }

    let unitPrice = product.price;
    let availableStock = product.stock;
    let name = product.name;
    let sku = product.sku;
    let variantId: string | null = null;

    if (raw.variantId) {
      const variant = product.variants.find((v) => v.id === raw.variantId);
      if (!variant) throw new PricingError("Product variant not found");
      unitPrice = variant.priceOverride ?? product.price;
      availableStock = variant.stock;
      sku = variant.sku;
      name = `${product.name} (${variant.name})`;
      variantId = variant.id;
    }

    if (quantity > availableStock) {
      throw new PricingError(
        `Only ${availableStock} unit(s) of "${name}" are in stock`
      );
    }

    items.push({
      productId: product.id,
      variantId,
      name,
      sku,
      image: product.images[0]?.url ?? null,
      unitPrice,
      quantity,
      lineTotal: unitPrice * quantity,
      availableStock,
    });
  }

  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);

  let discount = 0;
  let couponError: string | null = null;
  let normalizedCode: string | null = null;

  if (couponCode && couponCode.trim()) {
    normalizedCode = couponCode.trim().toUpperCase();
    try {
      discount = await validateAndPriceCoupon(normalizedCode, items, subtotal, userId);
    } catch (err) {
      couponError = err instanceof Error ? err.message : "Invalid coupon";
      discount = 0;
    }
  }

  const discountedSubtotal = Math.max(0, subtotal - discount);
  const shipping = discountedSubtotal >= FREE_SHIPPING_THRESHOLD || discountedSubtotal === 0 ? 0 : FLAT_SHIPPING;
  const tax = Math.round(discountedSubtotal * TAX_RATE);
  const total = discountedSubtotal + shipping + tax;

  return {
    items,
    subtotal,
    discount,
    shipping,
    tax,
    total,
    couponCode: couponError ? null : normalizedCode,
    couponError,
  };
}

/** Throws with a human-readable reason when the coupon cannot be applied. */
export async function validateAndPriceCoupon(
  code: string,
  items: QuoteLineItem[],
  subtotal: number,
  userId: string
): Promise<number> {
  const coupon = await prisma.coupon.findUnique({ where: { code } });
  if (!coupon || !coupon.active) throw new AppError("Coupon not found");
  if (coupon.expiresAt && coupon.expiresAt.getTime() < Date.now()) {
    throw new AppError("Coupon has expired");
  }
  if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
    throw new AppError("Coupon usage limit reached");
  }

  if (coupon.perCustomerLimit !== null) {
    const used = await prisma.couponUsage.count({ where: { couponId: coupon.id, userId } });
    if (used >= coupon.perCustomerLimit) {
      throw new AppError("You have already used this coupon the maximum number of times");
    }
  }

  let eligibleSubtotal = subtotal;
  if (coupon.productId) {
    const eligibleItems = items.filter((i) => i.productId === coupon.productId);
    if (!eligibleItems.length) throw new AppError("Coupon does not apply to items in your cart");
    eligibleSubtotal = eligibleItems.reduce((s, i) => s + i.lineTotal, 0);
  } else if (coupon.categoryId) {
    const productIds = items.map((i) => i.productId);
    const productsInCategory = await prisma.product.findMany({
      where: { id: { in: productIds }, categoryId: coupon.categoryId },
      select: { id: true },
    });
    const idSet = new Set(productsInCategory.map((p) => p.id));
    const eligibleItems = items.filter((i) => idSet.has(i.productId));
    if (!eligibleItems.length) throw new AppError("Coupon does not apply to items in your cart");
    eligibleSubtotal = eligibleItems.reduce((s, i) => s + i.lineTotal, 0);
  }

  if (coupon.minOrderValue && subtotal < coupon.minOrderValue) {
    throw new AppError(`Order must be at least ₹${(coupon.minOrderValue / 100).toFixed(0)} to use this coupon`);
  }

  const discount =
    coupon.type === "PERCENT"
      ? Math.round(eligibleSubtotal * (coupon.value / 100))
      : Math.min(coupon.value, eligibleSubtotal);

  return discount;
}

/**
 * Records a coupon redemption atomically. When the coupon has a total usage
 * limit, the limit check and the increment happen in the same conditional
 * UPDATE (WHERE usedCount &lt; usageLimit) so two simultaneous checkouts
 * can't both slip past a stale count and over-redeem the last use — the
 * loser's WHERE matches zero rows and the whole order transaction rolls back.
 */
export async function recordCouponUsage(
  tx: Prisma.TransactionClient,
  code: string,
  userId: string,
  orderId: string
) {
  const coupon = await tx.coupon.findUnique({ where: { code } });
  if (!coupon) return;

  if (coupon.usageLimit !== null) {
    const result = await tx.coupon.updateMany({
      where: { id: coupon.id, usedCount: { lt: coupon.usageLimit } },
      data: { usedCount: { increment: 1 } },
    });
    if (result.count === 0) {
      throw new PricingError(`Coupon "${code}" has just reached its usage limit — please remove it and try again`);
    }
  } else {
    await tx.coupon.update({ where: { id: coupon.id }, data: { usedCount: { increment: 1 } } });
  }

  await tx.couponUsage.create({ data: { couponId: coupon.id, userId, orderId } });
}
