"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotalEstimate } = useCart();

  if (items.length === 0) {
    return (
      <div className="container-page py-20 text-center flex flex-col items-center gap-4">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-20 h-20 text-[var(--text-faint)]">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.44a2 2 0 0 0 2 1.56h9.78a2 2 0 0 0 2-1.56l1.65-7.44H5.12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h1 className="text-xl font-semibold">Your cart is empty</h1>
        <p className="text-[var(--text-muted)] text-sm">Looks like you haven&apos;t added anything yet.</p>
        <Link href="/products" className="btn-primary px-6 py-2.5 text-sm mt-2">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="container-page py-8 grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 card-surface divide-y divide-[var(--border-subtle)]">
        <div className="p-4">
          <h1 className="text-lg font-semibold">Shopping Cart ({items.length} item{items.length > 1 ? "s" : ""})</h1>
        </div>
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-4 p-4">
            <Link href={`/products/${item.slug}`} className="w-24 h-24 rounded bg-[var(--surface-muted)] overflow-hidden shrink-0">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-full h-full object-contain p-2" />
              )}
            </Link>
            <div className="flex-1">
              <Link href={`/products/${item.slug}`} className="font-medium hover:text-[var(--brand-accent)]">
                {item.name}
              </Link>
              <p className="text-sm text-[var(--text-muted)] mt-1">{formatMoney(item.unitPrice)} each</p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center border border-[var(--border-subtle)] rounded">
                  <button
                    onClick={() => setQuantity(item.productId, item.variantId, Math.max(1, item.quantity - 1))}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-muted)]"
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="w-8 text-center text-sm">{item.quantity}</span>
                  <button
                    onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-muted)]"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
                <button onClick={() => removeItem(item.productId, item.variantId)} className="text-sm text-[var(--danger)] hover:underline">
                  Remove
                </button>
              </div>
            </div>
            <div className="font-semibold">{formatMoney(item.unitPrice * item.quantity)}</div>
          </div>
        ))}
      </div>

      <div className="card-surface p-5 h-fit">
        <h2 className="font-semibold mb-3">Price Details</h2>
        <div className="flex justify-between text-sm mb-2">
          <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
          <span>{formatMoney(subtotalEstimate)}</span>
        </div>
        <p className="text-xs text-[var(--text-faint)] mb-4">Delivery, discounts and tax are calculated at checkout.</p>
        <Link href="/checkout" className="btn-buy w-full py-3 text-sm text-center block">
          Proceed to Checkout
        </Link>
        <Link href="/products" className="block text-center text-sm text-[var(--brand-accent)] hover:underline mt-3">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
