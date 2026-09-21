import Link from "next/link";
import { formatMoney } from "@/lib/format";
import { optimizedImageUrl } from "@/lib/image";
import AddToCartButton from "@/components/AddToCartButton";
import StarRating from "@/components/StarRating";

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
  rating?: number | null;
  reviewCount?: number;
};

export default function ProductCard({ product }: { product: ProductCardData }) {
  return (
    <div className="group card-surface hover:shadow-md transition-shadow overflow-hidden flex flex-col">
      <Link href={`/products/${product.slug}`} className="relative block bg-[var(--surface-muted)] aspect-square overflow-hidden flex items-center justify-center">
        {product.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={optimizedImageUrl(product.image, 500)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform"
          />
        ) : (
          <span className="text-xs text-[var(--text-faint)]">No image</span>
        )}
        {product.stock === 0 && (
          <span className="absolute top-2 left-2 text-[11px] font-semibold bg-[var(--text)] text-white px-2 py-0.5 rounded">
            Out of stock
          </span>
        )}
      </Link>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <div className="flex gap-1.5 min-h-[18px]">
          {product.isNewArrival && (
            <span className="text-[10px] uppercase font-semibold bg-[var(--brand-accent)] text-white px-1.5 py-0.5 rounded">New</span>
          )}
          {product.isBestSeller && (
            <span className="text-[10px] uppercase font-semibold bg-[var(--warning)] text-white px-1.5 py-0.5 rounded">Best seller</span>
          )}
          {product.discountPercent ? (
            <span className="text-[10px] uppercase font-semibold bg-[var(--brand-buy)] text-white px-1.5 py-0.5 rounded">
              {product.discountPercent}% off
            </span>
          ) : null}
        </div>
        <Link href={`/products/${product.slug}`} className="font-medium text-sm hover:text-[var(--brand-accent)] line-clamp-2 leading-snug">
          {product.name}
        </Link>
        <StarRating rating={product.rating ?? null} count={product.reviewCount} />
        <div className="flex items-baseline gap-2 mt-auto">
          <span className="font-semibold text-[15px]">{formatMoney(product.price)}</span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-[var(--text-faint)] line-through">{formatMoney(product.originalPrice)}</span>
          )}
        </div>
        <div className="mt-1">
          {product.hasVariants ? (
            <Link href={`/products/${product.slug}`} className="btn-outline w-full inline-block text-center py-2 text-sm">
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
