"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { formatMoney } from "@/lib/format";
import RazorpayCheckout from "@/components/RazorpayCheckout";

type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

type Quote = {
  items: { quantity: number }[];
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
};

type Step = "address" | "review" | "payment";

const STEPS: { key: Step; label: string; shortLabel: string }[] = [
  { key: "address", label: "Delivery Address", shortLabel: "Address" },
  { key: "review", label: "Order Summary", shortLabel: "Summary" },
  { key: "payment", label: "Payment", shortLabel: "Payment" },
];

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, clear } = useCart();
  const { notify } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<Step>("address");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    phone: "",
    saveAddress: true,
  });
  const [couponCode, setCouponCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{
    id: string;
    razorpayOrderId?: string;
    razorpayKeyId?: string;
    paymentConfigured: boolean;
    total: number;
    currency: string;
  } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/checkout");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((d) => {
        setAddresses(d.addresses ?? []);
        const def = d.addresses?.find((a: Address) => a.isDefault);
        if (def) setAddressId(def.id);
        else if ((d.addresses ?? []).length === 0) setAddressId("");
      });
  }, [user]);

  useEffect(() => {
    if (!user || items.length === 0) return;
    setQuoteLoading(true);
    const body = {
      items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
      couponCode: couponCode || null,
    };
    fetch("/api/checkout/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
      .then((r) => r.json())
      .then((d) => setQuote(d.quote ?? null))
      .finally(() => setQuoteLoading(false));
  }, [user, items, couponCode]);

  const quoteItemCount = quote?.items.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

  function addressIsValid() {
    if (addressId) return true;
    const a = newAddress;
    return a.fullName && a.line1 && a.city && a.state && a.postalCode && a.country && a.phone;
  }

  async function placeOrder() {
    setError(null);
    setPlacing(true);
    try {
      const body: Record<string, unknown> = {
        items: items.map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
        couponCode: couponCode || null,
      };
      if (addressId) {
        body.addressId = addressId;
      } else {
        body.address = newAddress;
      }
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to place order");

      clear();
      setPlacedOrder({
        id: data.order.id,
        razorpayOrderId: data.razorpayOrderId,
        razorpayKeyId: data.razorpayKeyId,
        paymentConfigured: data.paymentConfigured,
        total: data.order.total,
        currency: data.order.currency,
      });
      setStep("payment");
      if (!data.paymentConfigured) {
        notify("Order created. Payment gateway isn't configured in this environment.", "info");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0 && !placedOrder) {
    return (
      <div className="container-page py-16 text-center">
        <p className="mb-4 text-[var(--text-muted)]">Your cart is empty.</p>
        <Link href="/products" className="text-[var(--brand-accent)] hover:underline text-sm font-medium">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8">
      <ol className="flex flex-wrap items-center gap-1 sm:gap-2 mb-8 text-sm">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1 sm:gap-2">
            <span
              className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                step === s.key
                  ? "bg-[var(--brand-accent)] text-white"
                  : STEPS.findIndex((x) => x.key === step) > i
                  ? "bg-[var(--success)] text-white"
                  : "bg-[var(--surface-muted)] text-[var(--text-faint)] border border-[var(--border-subtle)]"
              }`}
            >
              {i + 1}
            </span>
            <span className={step === s.key ? "font-semibold" : "text-[var(--text-muted)]"}>
              <span className="sm:hidden">{s.shortLabel}</span>
              <span className="hidden sm:inline">{s.label}</span>
            </span>
            {i < STEPS.length - 1 && <span className="w-4 sm:w-8 h-px bg-[var(--border-subtle)] mx-1 shrink-0" />}
          </li>
        ))}
      </ol>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 flex flex-col gap-6">
          {step === "address" && (
            <div className="card-surface p-5">
              <h2 className="font-semibold mb-4">Select or add a delivery address</h2>
              {addresses.length > 0 && (
                <div className="flex flex-col gap-2 mb-4">
                  {addresses.map((a) => (
                    <label key={a.id} className="flex gap-2 items-start text-sm border border-[var(--border-subtle)] rounded p-3 cursor-pointer hover:border-[var(--brand-accent)]">
                      <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
                      <span>
                        <span className="font-medium">{a.fullName}</span> — {a.line1}
                        {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country} · {a.phone}
                      </span>
                    </label>
                  ))}
                  <label className="flex gap-2 items-center text-sm">
                    <input type="radio" name="address" checked={addressId === ""} onChange={() => setAddressId("")} />
                    Use a new address
                  </label>
                </div>
              )}
              {addressId === "" && (
                <div className="grid grid-cols-2 gap-3">
                  <input required placeholder="Full name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="input-field col-span-2" />
                  <input required placeholder="Address line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="input-field col-span-2" />
                  <input placeholder="Address line 2 (optional)" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} className="input-field col-span-2" />
                  <input required placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="input-field" />
                  <input required placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="input-field" />
                  <input required placeholder="PIN code" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} className="input-field" />
                  <input required placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="input-field" />
                  <input required placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="input-field col-span-2" />
                  <label className="col-span-2 flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={newAddress.saveAddress} onChange={(e) => setNewAddress({ ...newAddress, saveAddress: e.target.checked })} />
                    Save this address to my account
                  </label>
                </div>
              )}
              <button
                onClick={() => addressIsValid() && setStep("review")}
                disabled={!addressIsValid()}
                className="btn-primary mt-5 px-6 py-2.5 text-sm disabled:opacity-40"
              >
                Continue to Order Summary
              </button>
            </div>
          )}

          {step === "review" && (
            <div className="card-surface p-5">
              <h2 className="font-semibold mb-4">Review your order</h2>
              <div className="flex flex-col gap-3 mb-5">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex justify-between text-sm">
                    <span>
                      {item.name} × {item.quantity}
                    </span>
                    <span>{formatMoney(item.unitPrice * item.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <h3 className="text-sm font-semibold mb-2">Have a coupon code?</h3>
                <input
                  placeholder="Enter code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="input-field max-w-xs"
                />
                {quote?.couponError && <p className="text-sm text-[var(--danger)] mt-1">{quote.couponError}</p>}
                {quote?.couponCode && <p className="text-sm text-[var(--success)] mt-1">Coupon &quot;{quote.couponCode}&quot; applied!</p>}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep("address")} className="btn-outline px-6 py-2.5 text-sm">
                  Back
                </button>
                <button
                  onClick={placeOrder}
                  disabled={placing || quoteLoading || !quote}
                  className="btn-primary px-6 py-2.5 text-sm"
                >
                  {placing ? "Placing order..." : "Continue to Payment"}
                </button>
              </div>
              {error && <p className="text-sm text-[var(--danger)] mt-3">{error}</p>}
            </div>
          )}

          {step === "payment" && placedOrder && (
            <div className="card-surface p-5">
              <h2 className="font-semibold mb-2">Payment</h2>
              <p className="text-sm text-[var(--text-muted)] mb-5">
                Order <span className="font-medium">created</span>. Complete payment to confirm it.
              </p>

              {placedOrder.paymentConfigured && placedOrder.razorpayOrderId && placedOrder.razorpayKeyId ? (
                <RazorpayCheckout
                  orderId={placedOrder.id}
                  razorpayOrderId={placedOrder.razorpayOrderId}
                  razorpayKeyId={placedOrder.razorpayKeyId}
                  amount={placedOrder.total}
                  currency={placedOrder.currency}
                  customerName={user?.name ?? ""}
                  customerEmail={user?.email ?? ""}
                />
              ) : (
                <div className="rounded-md bg-[var(--surface-muted)] border border-[var(--border-subtle)] p-4 text-sm">
                  <p className="font-medium mb-1">Payment gateway not configured</p>
                  <p className="text-[var(--text-muted)]">
                    This environment doesn&apos;t have RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET set, so real checkout is
                    disabled. Your order has been created with payment status &quot;Pending&quot; — configure
                    Razorpay to accept real payments.
                  </p>
                </div>
              )}

              <Link href={`/order-confirmation/${placedOrder.id}`} className="block text-sm text-[var(--text-muted)] hover:underline mt-4">
                View order status
              </Link>
            </div>
          )}
        </div>

        <div className="card-surface p-5 h-fit">
          <h2 className="font-semibold mb-3">Price Details</h2>
          {quoteLoading && <p className="text-sm text-[var(--text-faint)]">Calculating...</p>}
          {quote && (
            <div className="text-sm flex flex-col gap-2">
              <Row label={`Price (${quoteItemCount} item${quoteItemCount > 1 ? "s" : ""})`} value={quote.subtotal} />
              {quote.discount > 0 && <Row label="Discount" value={-quote.discount} highlight />}
              <Row label="Delivery" value={quote.shipping} free={quote.shipping === 0} />
              {quote.tax > 0 && <Row label="Tax" value={quote.tax} />}
              <div className="border-t border-[var(--border-subtle)] mt-1 pt-2">
                <Row label="Total Amount" value={quote.total} bold />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, highlight, free }: { label: string; value: number; bold?: boolean; highlight?: boolean; free?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span>{label}</span>
      <span className={highlight ? "text-[var(--success)]" : ""}>{free ? "FREE" : formatMoney(value)}</span>
    </div>
  );
}
