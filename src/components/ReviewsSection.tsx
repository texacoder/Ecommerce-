"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { formatDate } from "@/lib/format";

export type ReviewData = {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  createdAt: string;
  userId: string;
  userName: string;
};

export default function ReviewsSection({ productId, initialReviews }: { productId: string; initialReviews: ReviewData[] }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const myReview = reviews.find((r) => r.userId === user?.id);

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/reviews/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating, title, body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to update review");
        setReviews((prev) => prev.map((r) => (r.id === editingId ? { ...r, rating, title, body } : r)));
        setEditingId(null);
      } else {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, rating, title, body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Failed to submit review");
        setReviews((prev) => [
          { id: data.review.id, rating, title, body, createdAt: new Date().toISOString(), userId: user!.id, userName: user!.name },
          ...prev,
        ]);
      }
      setTitle("");
      setBody("");
      setRating(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteReview(id: string) {
    if (!confirm("Delete your review?")) return;
    const res = await fetch(`/api/reviews/${id}`, { method: "DELETE" });
    if (res.ok) setReviews((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Customer reviews</h2>

      {user && !myReview && !editingId && (
        <ReviewForm
          rating={rating}
          setRating={setRating}
          title={title}
          setTitle={setTitle}
          body={body}
          setBody={setBody}
          onSubmit={submitReview}
          submitting={submitting}
          error={error}
          submitLabel="Submit review"
        />
      )}

      {editingId && (
        <ReviewForm
          rating={rating}
          setRating={setRating}
          title={title}
          setTitle={setTitle}
          body={body}
          setBody={setBody}
          onSubmit={submitReview}
          submitting={submitting}
          error={error}
          submitLabel="Save changes"
          onCancel={() => setEditingId(null)}
        />
      )}

      {!user && <p className="text-sm text-[var(--text-muted)] mb-6">Log in to write a review.</p>}

      <div className="flex flex-col gap-4 mt-6">
        {reviews.length === 0 && <p className="text-sm text-[var(--text-muted)]">No reviews yet.</p>}
        {reviews.map((r) => (
          <div key={r.id} className="border border-[var(--border-subtle)] rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[var(--brand-buy)]">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                <span className="text-sm font-medium ml-2">{r.userName}</span>
              </div>
              <span className="text-xs text-[var(--text-faint)]">{formatDate(r.createdAt)}</span>
            </div>
            {r.title && <p className="font-medium mt-2">{r.title}</p>}
            {r.body && <p className="text-sm mt-1">{r.body}</p>}
            {user?.id === r.userId && (
              <div className="flex gap-3 mt-2 text-xs">
                <button
                  className="hover:underline"
                  onClick={() => {
                    setEditingId(r.id);
                    setRating(r.rating);
                    setTitle(r.title ?? "");
                    setBody(r.body ?? "");
                  }}
                >
                  Edit
                </button>
                <button className="hover:underline text-[var(--danger)]" onClick={() => deleteReview(r.id)}>
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ReviewForm({
  rating,
  setRating,
  title,
  setTitle,
  body,
  setBody,
  onSubmit,
  submitting,
  error,
  submitLabel,
  onCancel,
}: {
  rating: number;
  setRating: (n: number) => void;
  title: string;
  setTitle: (s: string) => void;
  body: string;
  setBody: (s: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  error: string | null;
  submitLabel: string;
  onCancel?: () => void;
}) {
  return (
    <form onSubmit={onSubmit} className="border border-[var(--border-subtle)] rounded-lg p-4 mb-6 flex flex-col gap-3 max-w-lg">
      <div>
        <label className="text-sm font-medium block mb-1">Rating</label>
        <select value={rating} onChange={(e) => setRating(Number(e.target.value))} className="border border-[var(--border-subtle)] rounded px-2 py-1 bg-transparent text-sm">
          {[5, 4, 3, 2, 1].map((n) => (
            <option key={n} value={n}>
              {n} star{n > 1 ? "s" : ""}
            </option>
          ))}
        </select>
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        className="border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Share your thoughts (optional)"
        rows={3}
        className="border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent"
      />
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
      <div className="flex gap-2">
        <button disabled={submitting} className="rounded-md btn-primary px-4 py-2 text-sm font-medium disabled:opacity-50">
          {submitting ? "Saving..." : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-md border border-[var(--border-subtle)] px-4 py-2 text-sm">
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
