import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

function toCardData(p: {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  stock: number;
  isNewArrival: boolean;
  isBestSeller: boolean;
  images: { url: string }[];
  _count: { variants: number };
}): ProductCardData {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    price: p.price,
    originalPrice: p.originalPrice,
    discountPercent: p.discountPercent,
    stock: p.stock,
    isNewArrival: p.isNewArrival,
    isBestSeller: p.isBestSeller,
    image: p.images[0]?.url ?? null,
    hasVariants: p._count.variants > 0,
  };
}

export default async function HomePage() {
  const baseWhere = { deletedAt: null, status: "PUBLISHED" as const, visible: true };
  const include = { images: { orderBy: { position: "asc" as const }, take: 1 }, _count: { select: { variants: true } } };

  const [banners, featured, newArrivals, bestSellers, categories] = await Promise.all([
    prisma.promotion.findMany({
      where: { type: "BANNER", active: true },
      orderBy: { position: "asc" },
      take: 3,
    }),
    prisma.product.findMany({ where: { ...baseWhere, isFeatured: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
    prisma.product.findMany({ where: { ...baseWhere, isNewArrival: true }, include, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { ...baseWhere, isBestSeller: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
    prisma.category.findMany({ where: { visible: true, parentId: null }, take: 6, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 flex flex-col gap-14">
      {banners.length > 0 && (
        <section className="grid gap-4 sm:grid-cols-3">
          {banners.map((b) => (
            <Link
              key={b.id}
              href={b.linkUrl ?? "/products"}
              className="relative rounded-xl overflow-hidden bg-black/5 dark:bg-white/5 aspect-[4/3] flex flex-col justify-end p-4 text-white"
              style={b.imageUrl ? { backgroundImage: `url(${b.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
            >
              <div className="absolute inset-0 bg-black/30" />
              <div className="relative">
                <h3 className="font-bold text-lg">{b.title}</h3>
                {b.subtitle && <p className="text-sm opacity-90">{b.subtitle}</p>}
              </div>
            </Link>
          ))}
        </section>
      )}

      {categories.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Shop by category</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/category/${c.slug}`}
                className="rounded-lg border border-black/10 dark:border-white/10 p-4 text-center hover:bg-black/5 dark:hover:bg-white/10 flex flex-col items-center gap-2"
              >
                {c.imageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.imageUrl} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                )}
                <span className="text-sm font-medium">{c.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {featured.length > 0 && (
        <ProductSection title="Featured products" products={featured.map(toCardData)} />
      )}
      {bestSellers.length > 0 && (
        <ProductSection title="Best sellers" products={bestSellers.map(toCardData)} />
      )}
      {newArrivals.length > 0 && (
        <ProductSection title="New arrivals" products={newArrivals.map(toCardData)} />
      )}
    </div>
  );
}

function ProductSection({ title, products }: { title: string; products: ProductCardData[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-xl font-semibold">{title}</h2>
        <Link href="/products" className="text-sm hover:underline text-black/60 dark:text-white/60">
          View all
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
