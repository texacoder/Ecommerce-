"use client";

import { useEffect, useState } from "react";
import { formatDate } from "@/lib/format";

type Review = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  status: string;
  createdAt: string;
  user: { name: string; email: string };
  product: { name: string; slug: string };
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [status, setStatus] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/admin/reviews?${params.toString()}`);
    const data = await res.json();
    setReviews(data.reviews ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function toggleStatus(id: string, current: string) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: current === "PUBLISHED" ? "HIDDEN" : "PUBLISHED" }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Permanently remove this review?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Reviews</h1>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm bg-transparent">
          <option value="">All</option>
          <option value="PUBLISHED">Published</option>
          <option value="HIDDEN">Hidden</option>
        </select>
      </div>

      <div className="flex flex-col gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="border border-[var(--border-subtle)] rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{r.product.name}</p>
                <p className="text-xs text-[var(--text-muted)]">
                  {r.user.name} ({r.user.email}) · {formatDate(r.createdAt)}
                </p>
                <p className="text-[var(--brand-buy)] mt-1">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</p>
              </div>
              <span className={`text-xs font-semibold ${r.status === "PUBLISHED" ? "text-[var(--success)]" : "text-[var(--text-faint)]"}`}>{r.status}</span>
            </div>
            {r.title && <p className="font-medium mt-2">{r.title}</p>}
            {r.body && <p className="text-sm mt-1">{r.body}</p>}
            <div className="flex gap-3 mt-2 text-xs">
              <button onClick={() => toggleStatus(r.id, r.status)} className="underline">
                {r.status === "PUBLISHED" ? "Hide" : "Publish"}
              </button>
              <button onClick={() => remove(r.id)} className="underline text-[var(--danger)]">
                Remove
              </button>
            </div>
          </div>
        ))}
        {reviews.length === 0 && <p className="text-sm text-[var(--text-muted)]">No reviews found.</p>}
      </div>
    </div>
  );
}
