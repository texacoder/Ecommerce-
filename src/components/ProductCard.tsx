import Link from "next/link";
import { formatMoney } from "@/lib/format";
import AddToCartButton from "@/components/AddToCartButton";

export type ProductCardData = {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  stock: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  image: string | null;
  hasVariants: boolean;
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="group border border-black/10 dark:border-white/10 rounded-lg overflow-hidden flex flex-col">
      <Link href={`/products/${product.slug}`} className="block bg-black/5 dark:bg-white/5 aspect-square overflow-hidden">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition" />
        )}
      </Link>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex gap-1.5">
          {product.isNewArrival && (
            <span className="text-[10px] uppercase font-semibold bg-emerald-600 text-white px-1.5 py-0.5 rounded">New</span>
          )}
          {product.isBestSeller && (
            <span className="text-[10px] uppercase font-semibold bg-amber-600 text-white px-1.5 py-0.5 rounded">Best seller</span>
          )}
          {product.discountPercent ? (
            <span className="text-[10px] uppercase font-semibold bg-rose-600 text-white px-1.5 py-0.5 rounded">
              -{product.discountPercent}%
            </span>
          ) : null}
        </div>
        <Link href={`/products/${product.slug}`} className="font-medium text-sm hover:underline line-clamp-2">
          {product.name}
        </Link>
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-semibold">{formatMoney(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-black/40 dark:text-white/40 line-through">
              {formatMoney(product.originalPrice)}
            </span>
          )}
        </div>
        <div className="mt-1">
          {product.hasVariants ? (
            <Link
              href={`/products/${product.slug}`}
              className="w-full inline-block text-center rounded-md border border-black/20 dark:border-white/20 py-2 text-sm font-medium hover:bg-black/5 dark:hover:bg-white/10"
            >
              View options
            </Link>
          ) : (
            <AddToCartButton
              productId={product.id}
              slug={product.slug}
              name={product.name}
              image={product.image}
              unitPrice={product.price}
              maxQuantity={product.stock}
            />
          )}
        </div>
      </div>
    </div>
  );
}
