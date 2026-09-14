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
    throw new Error(`Order is already ${current.toLowerCase()} and cannot be changed`);
  }
  if (next === "CANCELLED") return;
  if (next === "REFUNDED") {
    throw new Error("Use the refund action to move an order to refunded");
  }
  const currentIdx = ORDER_STATUS_FLOW.indexOf(current as (typeof ORDER_STATUS_FLOW)[number]);
  const nextIdx = ORDER_STATUS_FLOW.indexOf(next as (typeof ORDER_STATUS_FLOW)[number]);
  if (currentIdx === -1 || nextIdx === -1) {
    throw new Error(`Cannot move order from ${current} to ${next}`);
  }
  if (nextIdx < currentIdx) {
    throw new Error(`Cannot move order status backwards from ${current} to ${next}`);
  }
}
