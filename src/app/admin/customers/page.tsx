"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDate, formatMoney } from "@/lib/format";

type Customer = {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  _count: { orders: number };
  totalSpent: number;
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [q, setQ] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    const res = await fetch(`/api/admin/customers?${params.toString()}`);
    const data = await res.json();
    setCustomers(data.customers ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Customers</h1>
      <div className="flex gap-2 mb-4">
        <input
          placeholder="Search by name or email"
          value={q}
          onKeyDown={(e) => e.key === "Enter" && load()}
          onChange={(e) => setQ(e.target.value)}
          className="border border-[var(--border-subtle)] rounded px-3 py-1.5 text-sm bg-transparent w-72"
        />
        <button onClick={load} className="text-sm underline">
          Search
        </button>
      </div>

      <div className="border border-[var(--border-subtle)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--surface-muted)]">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Orders</th>
              <th className="p-3">Total spent</th>
              <th className="p-3">Status</th>
              <th className="p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border-subtle)]">
                <td className="p-3">
                  <Link href={`/admin/customers/${c.id}`} className="hover:underline font-medium">
                    {c.name}
                  </Link>
                </td>
                <td className="p-3">{c.email}</td>
                <td className="p-3">{c._count.orders}</td>
                <td className="p-3">{formatMoney(c.totalSpent)}</td>
                <td className="p-3">
                  <span className={c.status === "ACTIVE" ? "text-[var(--success)]" : "text-[var(--danger)]"}>{c.status}</span>
                </td>
                <td className="p-3 text-[var(--text-muted)]">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {customers.length === 0 && <p className="p-6 text-center text-[var(--text-muted)]">No customers found.</p>}
      </div>
    </div>
  );
}
