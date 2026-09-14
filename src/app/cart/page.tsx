"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart-context";
import { formatMoney } from "@/lib/format";

export default function CartPage() {
  const { items, setQuantity, removeItem, subtotalEstimate } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold mb-2">Your cart is empty</h1>
        <Link href="/products" className="text-sm underline">
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-xl font-semibold mb-6">Your cart</h1>
      <div className="flex flex-col gap-4">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId ?? ""}`} className="flex gap-4 border-b border-black/10 dark:border-white/10 pb-4">
            <div className="w-20 h-20 rounded bg-black/5 dark:bg-white/5 overflow-hidden shrink-0">
              {item.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1">
              <Link href={`/products/${item.slug}`} className="font-medium hover:underline">
                {item.name}
              </Link>
              <p className="text-sm text-black/50 dark:text-white/50 mt-1">{formatMoney(item.unitPrice)} each</p>
              <div className="flex items-center gap-3 mt-2">
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => setQuantity(item.productId, item.variantId, Math.max(1, Number(e.target.value) || 1))}
                  className="w-16 border border-black/15 dark:border-white/20 rounded px-2 py-1 text-sm bg-transparent"
                />
                <button onClick={() => removeItem(item.productId, item.variantId)} className="text-sm text-rose-600 hover:underline">
                  Remove
                </button>
              </div>
            </div>
            <div className="font-medium">{formatMoney(item.unitPrice * item.quantity)}</div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 text-lg font-semibold">
        <span>Estimated subtotal</span>
        <span>{formatMoney(subtotalEstimate)}</span>
      </div>
      <p className="text-xs text-black/40 dark:text-white/40 mt-1">Final total, shipping, and tax calculated at checkout.</p>

      <Link href="/checkout" className="mt-6 block text-center rounded-md bg-black text-white dark:bg-white dark:text-black py-3 font-medium hover:opacity-90">
        Proceed to checkout
      </Link>
    </div>
  );
}
