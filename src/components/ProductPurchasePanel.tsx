"use client";

import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { useCart } from "@/lib/cart-context";

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
  const { addItem } = useCart();
  const [variantId, setVariantId] = useState<string | null>(variants[0]?.id ?? null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selected = useMemo(() => variants.find((v) => v.id === variantId) ?? null, [variants, variantId]);
  const price = selected ? selected.price : basePrice;
  const stock = variants.length > 0 ? selected?.stock ?? 0 : baseStock;

  return (
    <div className="flex flex-col gap-3">
      {variants.length > 0 && (
        <div>
          <label className="text-sm font-medium block mb-1">Options</label>
          <select
            value={variantId ?? ""}
            onChange={(e) => setVariantId(e.target.value)}
            className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent w-full"
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
        <label className="text-sm font-medium">Qty</label>
        <input
          type="number"
          min={1}
          max={Math.max(1, stock)}
          value={qty}
          onChange={(e) => setQty(Math.max(1, Math.min(stock || 1, Number(e.target.value) || 1)))}
          className="w-20 border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent"
        />
        <span className="text-xs text-black/50 dark:text-white/50">{stock} in stock</span>
      </div>

      <button
        disabled={stock <= 0}
        onClick={() => {
          addItem({ productId, variantId, name, slug, image, unitPrice: price }, qty);
          setAdded(true);
          setTimeout(() => setAdded(false), 1200);
        }}
        className="rounded-md bg-black text-white dark:bg-white dark:text-black py-2.5 font-medium hover:opacity-90 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {stock <= 0 ? "Out of stock" : added ? "Added to cart ✓" : "Add to cart"}
      </button>
    </div>
  );
}
