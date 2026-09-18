"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";

type Variant = { id: string; name: string; sku: string; stock: number; price: number };

type Props = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  basePrice: number;
  baseStock: number;
  variants: Variant[];
};

export default function ProductPurchasePanel({ productId, slug, name, image, basePrice, baseStock, variants }: Props) {
  const { addItem, setBuyNowItem } = useCart();
  const { notify } = useToast();
  const router = useRouter();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [adding, setAdding] = useState(false);
  const [buying, setBuying] = useState(false);

  const selected = useMemo(() => variants.find((v) => v.id === variantId) ?? null, [variants, variantId]);
  const price = selected ? selected.price : basePrice;
  const stock = variants.length > 0 ? selected?.stock ?? 0 : baseStock;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-medium ${stock > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
          {stock > 0 ? `In Stock${stock <= 5 ? ` — only ${stock} left` : ""}` : "Out of Stock"}
        </span>
      </div>

      {variants.length > 0 && (
        <div>
          <label className="text-sm font-medium block mb-1">Options</label>
          <select
            value={variantId ?? ""}
            onChange={(e) => setVariantId(e.target.value)}
            className="input-field"
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id} disabled={v.stock === 0}>
                {v.name} {v.stock === 0 ? "(out of stock)" : ""} — {formatMoney(v.price)}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-center gap-3">
        <label className="text-sm font-medium">Quantity</label>
        <div className="flex items-center border border-[var(--border-subtle)] rounded">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-muted)]"
            aria-label="Decrease quantity"
          >
            −
          </button>
          <span className="w-10 text-center text-sm">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(Math.max(1, stock), q + 1))}
            className="w-8 h-8 flex items-center justify-center hover:bg-[var(--surface-muted)]"
            aria-label="Increase quantity"
          >
            +
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          disabled={stock <= 0 || adding}
          onClick={() => {
            if (adding) return;
            setAdding(true);
            addItem({ productId, variantId, name, slug, image, unitPrice: price }, qty);
            notify(`Added "${name}" to cart`, "success");
            setTimeout(() => setAdding(false), 800);
          }}
          className="btn-primary py-2.5 disabled:opacity-60"
        >
          Add to Cart
        </button>
        <button
          disabled={stock <= 0 || buying}
          onClick={() => {
            if (buying) return;
            setBuying(true);
            setBuyNowItem({ productId, variantId, name, slug, image, unitPrice: price }, qty);
            router.push("/checkout");
          }}
          className="btn-buy py-2.5 disabled:opacity-60"
        >
          Buy Now
        </button>
      </div>

      <div className="border border-[var(--border-subtle)] rounded-md p-3 text-sm flex flex-col gap-2">
        <div className="flex gap-2">
          <span aria-hidden>🚚</span>
          <span>
            <span className="font-medium">Free delivery</span> on orders over {formatMoney(FREE_SHIPPING_THRESHOLD)}.
          </span>
        </div>
        <div className="flex gap-2">
          <span aria-hidden>↩️</span>
          <span>
            <span className="font-medium">7-day returns.</span> Change of mind? Return it within 7 days of delivery.
          </span>
        </div>
      </div>
    </div>
  );
}
