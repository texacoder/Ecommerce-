"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatDate, formatMoney, statusLabel } from "@/lib/format";

type Order = { id: string; orderNumber: string; status: string; total: number; createdAt: string };
type Address = { id: string; fullName: string; line1: string; city: string; state: string; postalCode: string; country: string };
type Customer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  orders: Order[];
  addresses: Address[];
};

export default function AdminCustomerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [totals, setTotals] = useState({ totalOrders: 0, totalSpent: 0 });

  async function load() {
    const res = await fetch(`/api/admin/customers/${id}`);
    const data = await res.json();
    setCustomer(data.customer);
    setTotals({ totalOrders: data.totalOrders ?? 0, totalSpent: data.totalSpent ?? 0 });
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!customer) return <p className="text-sm text-black/50">Loading...</p>;

  async function toggleStatus() {
    if (!customer) return;
    const nextStatus = customer.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    if (nextStatus === "SUSPENDED" && !confirm(`Suspend ${customer.name}'s account? They won't be able to log in.`)) return;
    await fetch(`/api/admin/customers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    load();
  }

  return (
    <div className="max-w-2xl">
      <h1 className="text-xl font-semibold mb-1">{customer.name}</h1>
      <p className="text-sm text-black/50 dark:text-white/50 mb-6">
        {customer.email} · Joined {formatDate(customer.createdAt)}
      </p>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Stat label="Total orders" value={String(totals.totalOrders)} />
        <Stat label="Total spent" value={formatMoney(totals.totalSpent)} />
        <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
          <p className="text-xs text-black/50 dark:text-white/50">Account status</p>
          <button onClick={toggleStatus} className={`text-sm font-semibold mt-1 underline ${customer.status === "ACTIVE" ? "text-emerald-600" : "text-rose-600"}`}>
            {customer.status === "ACTIVE" ? "Active (click to suspend)" : "Suspended (click to reactivate)"}
          </button>
        </div>
      </div>

      <h2 className="font-semibold mb-2">Order history</h2>
      <div className="flex flex-col gap-2 mb-6">
        {customer.orders.length === 0 && <p className="text-sm text-black/50 dark:text-white/50">No orders yet.</p>}
        {customer.orders.map((o) => (
          <Link key={o.id} href={`/admin/orders/${o.id}`} className="border border-black/10 dark:border-white/10 rounded p-3 flex justify-between text-sm hover:bg-black/5 dark:hover:bg-white/10">
            <span>#{o.orderNumber}</span>
            <span>{statusLabel(o.status)}</span>
            <span>{formatMoney(o.total)}</span>
            <span className="text-black/50 dark:text-white/50">{formatDate(o.createdAt)}</span>
          </Link>
        ))}
      </div>

      <h2 className="font-semibold mb-2">Saved addresses</h2>
      <div className="flex flex-col gap-2">
        {customer.addresses.length === 0 && <p className="text-sm text-black/50 dark:text-white/50">None saved.</p>}
        {customer.addresses.map((a) => (
          <p key={a.id} className="text-sm border border-black/10 dark:border-white/10 rounded p-3">
            {a.fullName}, {a.line1}, {a.city}, {a.state} {a.postalCode}, {a.country}
          </p>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
      <p className="text-xs text-black/50 dark:text-white/50">{label}</p>
      <p className="text-lg font-semibold mt-1">{value}</p>
    </div>
  );
}
