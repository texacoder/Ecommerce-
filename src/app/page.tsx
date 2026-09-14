import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";

type RawProduct = {
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
  reviews: { rating: number }[];
};

function toCardData(p: RawProduct): ProductCardData {
  const ratings = p.reviews.map((r) => r.rating);
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
    rating: ratings.length ? ratings.reduce((s, r) => s + r, 0) / ratings.length : null,
    reviewCount: ratings.length,
  };
}

export default async function HomePage() {
  const baseWhere = { deletedAt: null, status: "PUBLISHED" as const, visible: true };
  const include = {
    images: { orderBy: { position: "asc" as const }, take: 1 },
    _count: { select: { variants: true } },
    reviews: { where: { status: "PUBLISHED" as const }, select: { rating: true } },
  };

  const [banners, featured, newArrivals, bestSellers, deals, categories] = await Promise.all([
    prisma.promotion.findMany({ where: { type: "BANNER", active: true }, orderBy: { position: "asc" }, take: 3 }),
    prisma.product.findMany({ where: { ...baseWhere, isFeatured: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
    prisma.product.findMany({ where: { ...baseWhere, isNewArrival: true }, include, take: 8, orderBy: { createdAt: "desc" } }),
    prisma.product.findMany({ where: { ...baseWhere, isBestSeller: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
    prisma.product.findMany({ where: { ...baseWhere, discountPercent: { gte: 15 } }, include, take: 8, orderBy: { discountPercent: "desc" } }),
    prisma.category.findMany({ where: { visible: true, parentId: null }, take: 8, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="flex flex-col">
      <section className="bg-[var(--brand-navy)]">
        <div className="container-page py-10 sm:py-14 grid md:grid-cols-2 gap-8 items-center">
          <div className="text-white">
            <p className="text-[var(--brand-buy)] font-semibold text-sm uppercase tracking-wide mb-2">Welcome to NEXORA</p>
            <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-4">
              Everything you need, delivered to your door.
            </h1>
            <p className="text-white/70 mb-6 max-w-md">
              Electronics, fashion, home essentials, beauty and more — all in one place, at prices that make sense.
            </p>
            <Link href="/products" className="btn-buy inline-block px-6 py-3 text-sm">
              Shop All Products
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {(banners.length ? banners : []).slice(0, 2).map((b) => (
              <Link
                key={b.id}
                href={b.linkUrl ?? "/products"}
                className="relative rounded-lg overflow-hidden aspect-[4/3] flex flex-col justify-end p-4 bg-white/5"
                style={b.imageUrl ? { backgroundImage: `url(${b.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
              >
                <div className="absolute inset-0 bg-black/30" />
                <div className="relative text-white">
                  <h3 className="font-bold text-sm">{b.title}</h3>
                  {b.subtitle && <p className="text-xs opacity-90 line-clamp-2">{b.subtitle}</p>}
                </div>
              </Link>
            ))}
            {banners.length === 0 && (
              <div className="col-span-2 rounded-lg bg-white/5 aspect-[16/9] flex items-center justify-center text-white/40 text-sm">
                Promotional banners appear here once added from the admin dashboard.
              </div>
            )}
          </div>
        </div>
      </section>

      <div className="container-page py-10 flex flex-col gap-12">
        {categories.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">Shop by Category</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-8 gap-3">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="card-surface hover:shadow-md transition-shadow p-3 text-center flex flex-col items-center gap-2"
                >
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.imageUrl} alt={c.name} className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-[var(--surface-muted)]" />
                  )}
                  <span className="text-xs font-medium leading-tight">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {deals.length > 0 && <ProductSection title="Today's Deals" viewAllHref="/deals" products={deals.map(toCardData)} accent />}
        {featured.length > 0 && <ProductSection title="Featured Products" viewAllHref="/products?featured=true" products={featured.map(toCardData)} />}
        {bestSellers.length > 0 && <ProductSection title="Best Sellers" viewAllHref="/products?bestSeller=true" products={bestSellers.map(toCardData)} />}
        {newArrivals.length > 0 && <ProductSection title="New Arrivals" viewAllHref="/products?sort=newest" products={newArrivals.map(toCardData)} />}

        {featured.length === 0 && bestSellers.length === 0 && newArrivals.length === 0 && deals.length === 0 && (
          <div className="text-center py-16 text-[var(--text-muted)]">
            <p className="text-lg font-medium mb-2">No products yet</p>
            <p className="text-sm">Add products from the admin dashboard and they will appear here automatically.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductSection({
  title,
  viewAllHref,
  products,
  accent,
}: {
  title: string;
  viewAllHref: string;
  products: ProductCardData[];
  accent?: boolean;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <h2 className={`text-lg font-semibold ${accent ? "text-[var(--brand-buy)]" : ""}`}>{title}</h2>
        <Link href={viewAllHref} className="text-sm text-[var(--brand-accent)] hover:underline font-medium">
          See all
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
