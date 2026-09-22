"use client";

import { useRouter } from "next/navigation";
import { formatMoney } from "@/lib/format";

export type ProductOption = { id: string; slug: string; name: string; price: number };

type Props = {
  current: ProductOption;
  options: ProductOption[];
};

// Distinct from the variant "Options" dropdown in ProductPurchasePanel:
// each entry here is a fully separate product (own name/photo/price), so
// picking one navigates to that product's own page instead of changing
// price/stock in place.
export default function ProductOptionsSelector({ current, options }: Props) {
  const router = useRouter();
  const all = [current, ...options];

  return (
    <div>
      <label className="text-sm font-medium block mb-1">Choose a design</label>
      <select
        value={current.id}
        onChange={(e) => {
          const target = all.find((o) => o.id === e.target.value);
          if (target && target.id !== current.id) router.push(`/products/${target.slug}`);
        }}
        className="input-field"
      >
        {all.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name} - {formatMoney(o.price)}
          </option>
        ))}
      </select>
    </div>
  );
}
