"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  user: { name: string; email: string };
  items: { id: string }[];
};

const STATUSES = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [wiping, setWiping] = useState(false);
  const [wipeMessage, setWipeMessage] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/orders?${params.toString()}`);
    const data = await res.json();
    setOrders(data.orders ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function wipeTestOrders() {
    if (
      !confirm(
        "Permanently delete EVERY order in the store - not just the ones shown by your current search/filter. This restocks reserved inventory and rolls back coupon usage first. Products, categories, coupons, and customer accounts are left untouched. This cannot be undone."
      )
    ) {
      return;
    }
    setWiping(true);
    setWipeMessage(null);
    try {
      const res = await fetch("/api/admin/orders/wipe-test-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: "WIPE" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to clear orders");
      setWipeMessage(data.log.join(" "));
      load();
    } catch (err) {
      setWipeMessage(err instanceof Error ? err.message : "Failed to clear orders");
    } finally {
      setWiping(false);
    }
  }

  return (
    <div>
      <div className="flex justify-between items-baseline mb-6">
        <h1 className="text-xl font-semibold">Orders</h1>
        <button onClick={wipeTestOrders} disabled={wiping || orders.length === 0} className="text-sm text-[var(--danger)] underline disabled:opacity-50">
          {wiping ? "Clearing..." : "Clear all orders (testing)"}
        </button>
      </div>
      {wipeMessage && <p className="text-sm text-[var(--text-muted)] mb-4">{wipeMessage}</p>}

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search order #, customer name or email"
          value={q}
          onKeyDown={(e) => e.key === "Enter" && load()}
          onChange={(e) => setQ(e.target.value)}
          className="border border-[var(--border-subtle)] rounded px-3 py-1.5 text-sm bg-transparent w-full sm:w-72"
        />
        <button onClick={load} className="text-sm underline">
          Search
        </button>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm bg-transparent sm:ml-auto">
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {statusLabel(s)}
            </option>
          ))}
        </select>
      </div>

      <div className="border border-[var(--border-subtle)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--surface-muted)]">
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Payment</th>
              <th className="p-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-[var(--border-subtle)]">
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline font-medium">
                    #{o.orderNumber}
                  </Link>
                </td>
                <td className="p-3">
                  {o.user.name}
                  <div className="text-xs text-[var(--text-muted)]">{o.user.email}</div>
                </td>
                <td className="p-3">{o.items.length}</td>
                <td className="p-3">{formatMoney(o.total)}</td>
                <td className="p-3">{statusLabel(o.status)}</td>
                <td className="p-3">{statusLabel(o.paymentStatus)}</td>
                <td className="p-3 text-[var(--text-muted)]">{formatDate(o.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-[var(--text-muted)]">No orders found.</p>}
      </div>
    </div>
  );
}
