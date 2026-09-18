"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/lib/toast-context";

type Props = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  variantId?: string | null;
  maxQuantity: number;
  disabled?: boolean;
  quantity?: number;
};

export default function AddToCartButton({
  productId,
  slug,
  name,
  image,
  unitPrice,
  variantId = null,
  maxQuantity,
  disabled,
  quantity = 1,
}: Props) {
  const { addItem } = useCart();
  const { notify } = useToast();
  const [adding, setAdding] = useState(false);

  if (disabled || maxQuantity <= 0) {
    return (
      <button disabled className="w-full rounded-md bg-[var(--surface-muted)] text-[var(--text-faint)] py-2 text-sm font-medium cursor-not-allowed border border-[var(--border-subtle)]">
        Out of stock
      </button>
    );
  }

  return (
    <button
      disabled={adding}
      onClick={() => {
        if (adding) return;
        setAdding(true);
        addItem({ productId, variantId, name, slug, image, unitPrice }, quantity);
        notify(`Added "${name}" to cart`, "success");
        setTimeout(() => setAdding(false), 800);
      }}
      className="btn-primary w-full py-2 text-sm disabled:opacity-60"
    >
      Add to Cart
    </button>
  );
}
