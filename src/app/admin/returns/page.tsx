"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatDateTime, formatMoney } from "@/lib/format";

type ReturnRequest = {
  id: string;
  reason: string;
  status: "REQUESTED" | "APPROVED" | "REJECTED";
  createdAt: string;
  user: { name: string; email: string };
  order: { id: string; orderNumber: string };
  orderItem: { nameSnapshot: string; quantity: number; priceSnapshot: number };
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [status, setStatus] = useState("REQUESTED");
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/returns?${params.toString()}`);
    const data = await res.json();
    setReturns(data.returnRequests ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function decide(id: string, decision: "APPROVED" | "REJECTED") {
    setMessage(null);
    const res = await fetch(`/api/admin/returns/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: decision }),
    });
    const data = await res.json();
    if (!res.ok) setMessage(data.error ?? "Failed to update return request");
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Returns</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm bg-transparent">
          <option value="REQUESTED">Pending review</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="">All</option>
        </select>
      </div>
      {message && <p className="text-sm text-[var(--danger)] mb-4">{message}</p>}

      <div className="flex flex-col gap-3">
        {returns.map((r) => (
          <div key={r.id} className="border border-[var(--border-subtle)] rounded-lg p-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <p className="font-medium">
                  {r.orderItem.nameSnapshot} × {r.orderItem.quantity}{" "}
                  <span className="text-[var(--text-muted)] font-normal">({formatMoney(r.orderItem.priceSnapshot * r.orderItem.quantity)})</span>
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1">
                  <Link href={`/admin/orders/${r.order.id}`} className="hover:underline">
                    Order #{r.order.orderNumber}
                  </Link>
                  {" · "}
                  {r.user.name} ({r.user.email}) · {formatDateTime(r.createdAt)}
                </p>
              </div>
              <span
                className={`text-xs font-semibold shrink-0 ${
                  r.status === "APPROVED" ? "text-[var(--success)]" : r.status === "REJECTED" ? "text-[var(--danger)]" : "text-[var(--warning)]"
                }`}
              >
                {r.status}
              </span>
            </div>
            <p className="text-sm mt-2">
              <span className="text-[var(--text-muted)]">Reason: </span>
              {r.reason}
            </p>
            {r.status === "REQUESTED" && (
              <div className="flex gap-3 mt-3 text-xs">
                <button onClick={() => decide(r.id, "APPROVED")} className="underline text-[var(--success)]">
                  Accept return
                </button>
                <button onClick={() => decide(r.id, "REJECTED")} className="underline text-[var(--danger)]">
                  Reject return
                </button>
              </div>
            )}
          </div>
        ))}
        {returns.length === 0 && <p className="text-sm text-[var(--text-muted)]">No return requests found.</p>}
      </div>
    </div>
  );
}
