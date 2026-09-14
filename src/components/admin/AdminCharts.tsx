"use client";

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Cell } from "recharts";
import { formatMoney, statusLabel } from "@/lib/format";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "#b5730b",
  CONFIRMED: "#0e7c6b",
  PROCESSING: "#0e7c6b",
  SHIPPED: "#101a2c",
  OUT_FOR_DELIVERY: "#101a2c",
  DELIVERED: "#12805c",
  CANCELLED: "#c0392b",
  REFUNDED: "#8a919c",
};

export function RevenueChart({ data }: { data: { date: string; revenue: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No revenue yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatMoney(v)} width={70} />
        <Tooltip formatter={(v) => formatMoney(Number(v))} labelFormatter={(l) => `Date: ${l}`} />
        <Line type="monotone" dataKey="revenue" stroke="#0e7c6b" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function OrderStatusChart({ data }: { data: { status: string; count: number }[] }) {
  if (data.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">No orders yet.</p>;
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" />
        <XAxis dataKey="status" tick={{ fontSize: 10 }} tickFormatter={(s) => statusLabel(s)} interval={0} angle={-20} textAnchor="end" height={50} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip labelFormatter={(l) => statusLabel(String(l))} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.status} fill={STATUS_COLORS[d.status] ?? "#101a2c"} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
