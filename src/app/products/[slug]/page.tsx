import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/format";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ReviewsSection from "@/components/ReviewsSection";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED", visible: true },
    include: {
      category: true,
      images: { orderBy: { position: "asc" } },
      variants: true,
      reviews: {
        where: { status: "PUBLISHED" },
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!product) notFound();

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null;
  const specs: Record<string, string> = product.specifications ? JSON.parse(product.specifications) : {};

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="text-sm text-black/50 dark:text-white/50 mb-4 flex gap-1">
        <Link href="/products" className="hover:underline">
          Products
        </Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/category/${product.category.slug}`} className="hover:underline">
              {product.category.name}
            </Link>
          </>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="flex flex-col gap-3">
          <div className="aspect-square rounded-lg overflow-hidden bg-black/5 dark:bg-white/5">
            {product.images[0] && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={product.images[0].url} alt={product.name} className="w-full h-full object-cover" />
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.slice(1).map((img) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img key={img.id} src={img.url} alt={product.name} className="w-16 h-16 rounded object-cover bg-black/5 dark:bg-white/5" />
              ))}
            </div>
          )}
        </div>

        <div>
          <div className="flex gap-1.5 mb-2">
            {product.isNewArrival && <Badge label="New" color="bg-emerald-600" />}
            {product.isBestSeller && <Badge label="Best seller" color="bg-amber-600" />}
            {product.discountPercent ? <Badge label={`-${product.discountPercent}%`} color="bg-rose-600" /> : null}
          </div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          {product.brand && <p className="text-black/50 dark:text-white/50 text-sm mt-1">{product.brand}</p>}
          {avgRating !== null && (
            <p className="text-sm mt-1">
              {"★".repeat(Math.round(avgRating))}
              {"☆".repeat(5 - Math.round(avgRating))} ({product.reviews.length})
            </p>
          )}

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-2xl font-bold">{formatMoney(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <span className="text-black/40 dark:text-white/40 line-through">{formatMoney(product.originalPrice)}</span>
            )}
          </div>

          {product.description && <p className="mt-4 text-sm leading-relaxed">{product.description}</p>}

          <div className="mt-6">
            <ProductPurchasePanel
              productId={product.id}
              slug={product.slug}
              name={product.name}
              image={product.images[0]?.url ?? null}
              basePrice={product.price}
              baseStock={product.stock}
              variants={product.variants.map((v) => ({
                id: v.id,
                name: v.name,
                sku: v.sku,
                stock: v.stock,
                price: v.priceOverride ?? product.price,
              }))}
            />
          </div>

          {Object.keys(specs).length > 0 && (
            <div className="mt-8">
              <h2 className="font-semibold mb-2">Specifications</h2>
              <table className="text-sm w-full">
                <tbody>
                  {Object.entries(specs).map(([k, v]) => (
                    <tr key={k} className="border-b border-black/5 dark:border-white/10">
                      <td className="py-1.5 pr-4 text-black/50 dark:text-white/50 w-1/3">{k}</td>
                      <td className="py-1.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12">
        <ReviewsSection
          productId={product.id}
          initialReviews={product.reviews.map((r) => ({
            id: r.id,
            rating: r.rating,
            title: r.title,
            body: r.body,
            createdAt: r.createdAt.toISOString(),
            userId: r.userId,
            userName: r.user.name,
          }))}
        />
      </div>
    </div>
  );
}

function Badge({ label, color }: { label: string; color: string }) {
  return <span className={`text-[10px] uppercase font-semibold text-white px-1.5 py-0.5 rounded ${color}`}>{label}</span>;
}
