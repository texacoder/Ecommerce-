"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Props = {
  orderId: string;
  itemId: string;
  returnWindowOpen: boolean;
  existingRequest: { status: "REQUESTED" | "APPROVED" | "REJECTED"; reason: string } | null;
};

export default function ReturnItemControl({ orderId, itemId, returnWindowOpen, existingRequest }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (existingRequest) {
    if (existingRequest.status === "REQUESTED") {
      return <p className="text-xs text-[var(--text-muted)] mt-1">Return requested — pending review.</p>;
    }
    if (existingRequest.status === "APPROVED") {
      return <p className="text-xs text-[var(--success)] mt-1">Return approved. We&apos;ll follow up with next steps.</p>;
    }
    return (
      <p className="text-xs text-[var(--danger)] mt-1">
        Return request rejected.{" "}
        <Link href="/customer-service" className="underline">
          Contact customer service
        </Link>{" "}
        if you&apos;d like to discuss this.
      </p>
    );
  }

  if (!returnWindowOpen) {
    return <p className="text-xs text-[var(--text-faint)] mt-1">Return window (7 days from delivery) has closed.</p>;
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs text-[var(--brand-accent)] underline mt-1">
        Return this item
      </button>
    );
  }

  async function submit() {
    if (!reason.trim()) {
      setError("Please tell us why you're returning this.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/items/${itemId}/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to submit return request");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit return request");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-2">
      <textarea
        rows={2}
        placeholder="Why are you returning this item?"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        className="border border-[var(--border-subtle)] rounded px-3 py-1.5 text-sm bg-transparent w-full"
      />
      {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
      <div className="flex gap-3 text-xs">
        <button onClick={submit} disabled={submitting} className="btn-primary px-3 py-1 disabled:opacity-50">
          {submitting ? "Submitting..." : "Submit return request"}
        </button>
        <button
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          disabled={submitting}
          className="underline"
        >
          Cancel
        </button>
      </div>
      <Link href="/customer-service" className="text-xs text-[var(--text-muted)] underline w-fit">
        Or contact customer service instead
      </Link>
    </div>
  );
}
