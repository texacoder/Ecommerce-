"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatDateTime, formatMoney, statusLabel } from "@/lib/format";

const FORWARD_STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"];

type OrderItem = { id: string; nameSnapshot: string; skuSnapshot: string; priceSnapshot: number; quantity: number };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  refundedAmount: number;
  couponCode: string | null;
  addressSnapshot: string;
  trackingCarrier: string | null;
  trackingNumber: string | null;
  cancelReason: string | null;
  createdAt: string;
  user: { name: string; email: string };
  items: OrderItem[];
};

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [tracking, setTracking] = useState({ carrier: "", number: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch(`/api/admin/orders/${id}`);
    const data = await res.json();
    setOrder(data.order);
    if (data.order) setTracking({ carrier: data.order.trackingCarrier ?? "", number: data.order.trackingNumber ?? "" });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!order) return <p className="text-sm text-black/50">Loading...</p>;

  const address = JSON.parse(order.addressSnapshot);

  async function updateStatus(status: string) {
    setMessage(null);
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error);
    load();
  }

  async function saveTracking() {
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackingCarrier: tracking.carrier || null, trackingNumber: tracking.number || null }),
    });
    load();
  }

  async function cancelOrder() {
    const reason = prompt("Reason for cancellation (optional):") ?? "";
    if (!confirm("Cancel this order? Stock will be returned to inventory.")) return;
    const res = await fetch(`/api/admin/orders/${id}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error);
    load();
  }

  async function refund() {
    if (!confirm("Refund this order in full?")) return;
    const res = await fetch(`/api/admin/orders/${id}/refund`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) setMessage(data.error);
    load();
  }

  const canCancel = !["CANCELLED", "DELIVERED", "REFUNDED"].includes(order.status);
  const canRefund = (order.paymentStatus === "PAID" || order.paymentStatus === "PARTIALLY_REFUNDED") && order.refundedAmount < order.total;

  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-semibold mb-1">Order #{order.orderNumber}</h1>
      <p className="text-xs text-black/40 dark:text-white/40 mb-6">Placed {formatDateTime(order.createdAt)}</p>
      {message && <p className="text-sm text-rose-600 mb-4">{message}</p>}

      <div className="grid sm:grid-cols-2 gap-4 mb-6">
        <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
          <h2 className="font-medium mb-2">Customer</h2>
          <p className="text-sm">{order.user.name}</p>
          <p className="text-sm text-black/50 dark:text-white/50">{order.user.email}</p>
        </div>
        <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
          <h2 className="font-medium mb-2">Delivery address</h2>
          <p className="text-sm">
            {address.fullName}, {address.line1}
            {address.line2 ? `, ${address.line2}` : ""}, {address.city}, {address.state} {address.postalCode}, {address.country} — {address.phone}
          </p>
        </div>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded-lg p-4 mb-6">
        <h2 className="font-medium mb-3">Status</h2>
        <div className="flex flex-wrap gap-2 mb-3">
          {FORWARD_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateStatus(s)}
              disabled={order.status === s || order.status === "CANCELLED" || order.status === "REFUNDED"}
              className={`text-xs rounded-full px-3 py-1 border ${order.status === s ? "bg-black text-white dark:bg-white dark:text-black border-transparent" : "border-black/20 dark:border-white/20"} disabled:opacity-40`}
            >
              {statusLabel(s)}
            </button>
          ))}
        </div>
        <div className="flex gap-3 text-sm">
          {canCancel && (
            <button onClick={cancelOrder} className="text-rose-600 underline">
              Cancel order
            </button>
          )}
          {canRefund && (
            <button onClick={refund} className="text-amber-600 underline">
              Refund payment
            </button>
          )}
        </div>
        {order.cancelReason && <p className="text-sm text-black/50 dark:text-white/50 mt-2">Cancel reason: {order.cancelReason}</p>}
        <p className="text-sm mt-2">
          Payment: {statusLabel(order.paymentStatus)}
          {order.refundedAmount > 0 && ` (refunded ${formatMoney(order.refundedAmount)})`}
        </p>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded-lg p-4 mb-6">
        <h2 className="font-medium mb-3">Tracking</h2>
        <div className="flex gap-2">
          <input placeholder="Carrier" value={tracking.carrier} onChange={(e) => setTracking({ ...tracking, carrier: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-1.5 text-sm bg-transparent" />
          <input placeholder="Tracking number" value={tracking.number} onChange={(e) => setTracking({ ...tracking, number: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-1.5 text-sm bg-transparent" />
          <button onClick={saveTracking} className="text-sm underline">
            Save
          </button>
        </div>
      </div>

      <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
        <h2 className="font-medium mb-3">Items</h2>
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm py-1.5 border-b border-black/5 dark:border-white/10 last:border-0">
            <span>
              {item.nameSnapshot} ({item.skuSnapshot}) × {item.quantity}
            </span>
            <span>{formatMoney(item.priceSnapshot * item.quantity)}</span>
          </div>
        ))}
        <div className="flex flex-col gap-1 text-sm mt-3 pt-3 border-t border-black/10 dark:border-white/10">
          <Row label="Subtotal" value={order.subtotal} />
          {order.discount > 0 && <Row label={`Discount${order.couponCode ? ` (${order.couponCode})` : ""}`} value={-order.discount} />}
          <Row label="Shipping" value={order.shipping} />
          <Row label="Tax" value={order.tax} />
          <Row label="Total" value={order.total} bold />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
