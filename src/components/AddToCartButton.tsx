"use client";

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

  if (disabled || maxQuantity <= 0) {
    return (
      <button disabled className="w-full rounded-md bg-[var(--surface-muted)] text-[var(--text-faint)] py-2 text-sm font-medium cursor-not-allowed border border-[var(--border-subtle)]">
        Out of stock
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        addItem({ productId, variantId, name, slug, image, unitPrice }, quantity);
        notify(`Added "${name}" to cart`, "success");
      }}
      className="btn-primary w-full py-2 text-sm"
    >
      Add to Cart
    </button>
  );
}
