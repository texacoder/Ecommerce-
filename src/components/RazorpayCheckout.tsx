"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

type Props = {
  orderId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  label?: string;
};

export default function RazorpayCheckout({
  orderId,
  razorpayOrderId,
  razorpayKeyId,
  amount,
  currency,
  customerName,
  customerEmail,
  label = "Pay now",
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pay() {
    setLoading(true);
    setError(null);
    const ok = await loadRazorpayScript();
    if (!ok) {
      setError("Could not load the payment widget. Check your connection and try again.");
      setLoading(false);
      return;
    }

    const rzp = new window.Razorpay({
      key: razorpayKeyId,
      order_id: razorpayOrderId,
      amount,
      currency,
      name: "NEXORA",
      description: "Order payment",
      prefill: { name: customerName, email: customerEmail },
      theme: { color: "#101a2c" },
      handler: async (response: {
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      }) => {
        try {
          const res = await fetch(`/api/orders/${orderId}/verify-payment`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "Payment verification failed");
          router.push(`/order-confirmation/${orderId}`);
          router.refresh();
        } catch (err) {
          setError(err instanceof Error ? err.message : "Payment verification failed");
        } finally {
          setLoading(false);
        }
      },
      modal: {
        ondismiss: async () => {
          await fetch(`/api/orders/${orderId}/payment-failed`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ razorpay_order_id: razorpayOrderId, reason: "Checkout closed by customer" }),
          }).catch(() => null);
          setLoading(false);
          router.push(`/order-confirmation/${orderId}`);
        },
      },
    });

    rzp.open();
  }

  return (
    <div>
      <button onClick={pay} disabled={loading} className="btn-buy w-full py-3 text-sm">
        {loading ? "Opening secure payment..." : label}
      </button>
      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
    </div>
  );
}
