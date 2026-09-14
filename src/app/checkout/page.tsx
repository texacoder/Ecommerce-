"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";

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
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode: string | null;
  couponError: string | null;
};

export default function CheckoutPage() {
  const { user, loading } = useAuth();
  const { items, clear } = useCart();
  const router = useRouter();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressId, setAddressId] = useState<string>("");
  const [newAddress, setNewAddress] = useState({
    fullName: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "USA",
    phone: "",
    saveAddress: true,
  });
  const [couponCode, setCouponCode] = useState("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);

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

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
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
      router.push(`/order-confirmation/${data.order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setPlacing(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="mb-4">Your cart is empty.</p>
        <Link href="/products" className="underline text-sm">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 grid md:grid-cols-3 gap-8">
      <form onSubmit={placeOrder} className="md:col-span-2 flex flex-col gap-6">
        <div>
          <h2 className="font-semibold mb-3">Delivery address</h2>
          {addresses.length > 0 && (
            <div className="flex flex-col gap-2 mb-3">
              {addresses.map((a) => (
                <label key={a.id} className="flex gap-2 items-start text-sm border border-black/10 dark:border-white/10 rounded p-3 cursor-pointer">
                  <input type="radio" name="address" checked={addressId === a.id} onChange={() => setAddressId(a.id)} className="mt-1" />
                  <span>
                    {a.fullName}, {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country} — {a.phone}
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
              <input required placeholder="Full name" value={newAddress.fullName} onChange={(e) => setNewAddress({ ...newAddress, fullName: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input required placeholder="Address line 1" value={newAddress.line1} onChange={(e) => setNewAddress({ ...newAddress, line1: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input placeholder="Address line 2 (optional)" value={newAddress.line2} onChange={(e) => setNewAddress({ ...newAddress, line2: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input required placeholder="City" value={newAddress.city} onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input required placeholder="State" value={newAddress.state} onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input required placeholder="Postal code" value={newAddress.postalCode} onChange={(e) => setNewAddress({ ...newAddress, postalCode: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input required placeholder="Country" value={newAddress.country} onChange={(e) => setNewAddress({ ...newAddress, country: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <input required placeholder="Phone" value={newAddress.phone} onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
              <label className="col-span-2 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={newAddress.saveAddress} onChange={(e) => setNewAddress({ ...newAddress, saveAddress: e.target.checked })} />
                Save this address to my account
              </label>
            </div>
          )}
        </div>

        <div>
          <h2 className="font-semibold mb-3">Coupon code</h2>
          <input
            placeholder="Enter code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent"
          />
          {quote?.couponError && <p className="text-sm text-rose-600 mt-1">{quote.couponError}</p>}
          {quote?.couponCode && <p className="text-sm text-emerald-600 mt-1">Coupon applied!</p>}
        </div>

        {error && <p className="text-sm text-rose-600">{error}</p>}

        <button
          disabled={placing || quoteLoading || !quote}
          className="rounded-md bg-black text-white dark:bg-white dark:text-black py-3 font-medium hover:opacity-90 disabled:opacity-50"
        >
          {placing ? "Placing order..." : "Place order"}
        </button>
      </form>

      <div className="border border-black/10 dark:border-white/10 rounded-lg p-4 h-fit">
        <h2 className="font-semibold mb-3">Order summary</h2>
        {quoteLoading && <p className="text-sm text-black/50">Calculating...</p>}
        {quote && (
          <div className="text-sm flex flex-col gap-1.5">
            <Row label="Subtotal" value={quote.subtotal} />
            {quote.discount > 0 && <Row label="Discount" value={-quote.discount} />}
            <Row label="Shipping" value={quote.shipping} />
            <Row label="Tax" value={quote.tax} />
            <div className="border-t border-black/10 dark:border-white/10 mt-2 pt-2">
              <Row label="Total" value={quote.total} bold />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-base" : ""}`}>
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
