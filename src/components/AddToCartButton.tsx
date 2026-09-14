"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart-context";

type Props = {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  unitPrice: number;
  variantId?: string | null;
  maxQuantity: number;
  disabled?: boolean;
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
}: Props) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  if (disabled || maxQuantity <= 0) {
    return (
      <button disabled className="w-full rounded-md bg-black/10 dark:bg-white/10 text-black/40 dark:text-white/40 py-2 text-sm font-medium cursor-not-allowed">
        Out of stock
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addItem({ productId, variantId, name, slug, image, unitPrice }, 1);
        setAdded(true);
        setTimeout(() => setAdded(false), 1200);
      }}
      className="w-full rounded-md bg-black text-white dark:bg-white dark:text-black py-2 text-sm font-medium hover:opacity-90 transition"
    >
      {added ? "Added ✓" : "Add to cart"}
    </button>
  );
}
