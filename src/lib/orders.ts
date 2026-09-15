import type { Prisma } from "@prisma/client";
import { AppError } from "@/lib/errors";

export const ORDER_STATUS_FLOW = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
] as const;

export type OrderStatus =
  | (typeof ORDER_STATUS_FLOW)[number]
  | "CANCELLED"
  | "REFUNDED";

const TERMINAL: OrderStatus[] = ["DELIVERED", "CANCELLED", "REFUNDED"];

/** Guards against nonsensical admin transitions (e.g. shipping a cancelled order). */
export function assertValidTransition(current: OrderStatus, next: OrderStatus) {
  if (current === next) return;
  if (TERMINAL.includes(current)) {
    throw new AppError(`Order is already ${current.toLowerCase()} and cannot be changed`);
  }
  if (next === "CANCELLED") return;
  if (next === "REFUNDED") {
    throw new AppError("Use the refund action to move an order to refunded");
  }
  const currentIdx = ORDER_STATUS_FLOW.indexOf(current as (typeof ORDER_STATUS_FLOW)[number]);
  const nextIdx = ORDER_STATUS_FLOW.indexOf(next as (typeof ORDER_STATUS_FLOW)[number]);
  if (currentIdx === -1 || nextIdx === -1) {
    throw new AppError(`Cannot move order from ${current} to ${next}`);
  }
  if (nextIdx < currentIdx) {
    throw new AppError(`Cannot move order status backwards from ${current} to ${next}`);
  }
}

/**
 * Returns reserved stock to the catalog. Stock is decremented at order
 * creation time (to prevent overselling while payment is in flight), so
 * cancelling for any reason — admin cancellation, abandoned checkout, a
 * failed/expired payment — must release it back via this same path.
 */
export async function restockOrderItems(
  tx: Prisma.TransactionClient,
  items: { productId: string | null; variantId: string | null; quantity: number }[]
) {
  for (const item of items) {
    if (item.variantId) {
      await tx.productVariant
        .update({ where: { id: item.variantId }, data: { stock: { increment: item.quantity } } })
        .catch(() => null);
    } else if (item.productId) {
      await tx.product
        .update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } })
        .catch(() => null);
    }
  }
}
