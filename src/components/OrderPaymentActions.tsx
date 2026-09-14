"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import RazorpayCheckout from "@/components/RazorpayCheckout";

type Props = {
  orderId: string;
  total: number;
  currency: string;
};

export default function OrderPaymentActions({ orderId, total, currency }: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const [retry, setRetry] = useState<{ razorpayOrderId: string; razorpayKeyId: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function retryPayment() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${orderId}/retry-payment`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start a new payment attempt");
      setRetry({ razorpayOrderId: data.razorpayOrderId, razorpayKeyId: data.razorpayKeyId });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  async function cancelOrder() {
    if (!confirm("Cancel this order? The items will be released back into stock.")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Could not cancel this order");
      }
      router.push("/account/orders");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (retry) {
    return (
      <RazorpayCheckout
        orderId={orderId}
        razorpayOrderId={retry.razorpayOrderId}
        razorpayKeyId={retry.razorpayKeyId}
        amount={total}
        currency={currency}
        customerName={user?.name ?? ""}
        customerEmail={user?.email ?? ""}
        label="Pay now"
      />
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-3">
        <button onClick={retryPayment} disabled={busy} className="btn-primary px-5 py-2 text-sm">
          {busy ? "Please wait..." : "Retry Payment"}
        </button>
        <button onClick={cancelOrder} disabled={busy} className="btn-outline px-5 py-2 text-sm">
          Cancel Order
        </button>
      </div>
      {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
    </div>
  );
}
