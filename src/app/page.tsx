import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import PromoTile from "@/components/PromoTile";

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

const activePromotionWhere = (now: Date) => ({
  active: true,
  AND: [
    { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
    { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
  ],
});

export default async function HomePage() {
  const now = new Date();
  const baseWhere = { deletedAt: null, status: "PUBLISHED" as const, visible: true };
  const include = {
    images: { orderBy: { position: "asc" as const }, take: 1 },
    _count: { select: { variants: true } },
    reviews: { where: { status: "PUBLISHED" as const }, select: { rating: true } },
  };

  const [banners, featured, newArrivals, bestSellers, deals, categories, saleCampaigns, dealPromos, featuredSectionPromos] =
    await Promise.all([
      prisma.promotion.findMany({ where: { type: "BANNER", ...activePromotionWhere(now) }, orderBy: { position: "asc" }, take: 3 }),
      prisma.product.findMany({ where: { ...baseWhere, isFeatured: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
      prisma.product.findMany({ where: { ...baseWhere, isNewArrival: true }, include, take: 8, orderBy: { createdAt: "desc" } }),
      prisma.product.findMany({ where: { ...baseWhere, isBestSeller: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
      prisma.product.findMany({ where: { ...baseWhere, discountPercent: { gte: 15 } }, include, take: 8, orderBy: { discountPercent: "desc" } }),
      prisma.category.findMany({ where: { visible: true, parentId: null }, take: 8, orderBy: { name: "asc" } }),
      prisma.promotion.findMany({ where: { type: "SALE_CAMPAIGN", ...activePromotionWhere(now) }, orderBy: { position: "asc" }, take: 3 }),
      prisma.promotion.findMany({
        where: { type: "DEAL", ...activePromotionWhere(now) },
        include: { product: { select: { slug: true } } },
        orderBy: { position: "asc" },
        take: 4,
      }),
      prisma.promotion.findMany({
        where: { type: "FEATURED_SECTION", ...activePromotionWhere(now) },
        include: { product: { select: { slug: true } }, category: { select: { slug: true } } },
        orderBy: { position: "asc" },
      }),
    ]);

  // FEATURED_SECTION promotions can be scoped to a category (render that
  // category's products) or left as a standalone spotlight banner. A
  // category scope includes its subcategories' products too — products are
  // normally assigned to leaf subcategories, not the parent, so a promo
  // scoped to a parent category (e.g. "Electronics") would otherwise match
  // nothing even though it obviously should include "Headphones", etc.
  const featuredSections = await Promise.all(
    featuredSectionPromos.map(async (promo) => {
      if (!promo.categoryId) return { promo, products: [] as ProductCardData[] };
      const children = await prisma.category.findMany({ where: { parentId: promo.categoryId }, select: { id: true } });
      const categoryIds = [promo.categoryId, ...children.map((c) => c.id)];
      const products = await prisma.product.findMany({
        where: { ...baseWhere, categoryId: { in: categoryIds } },
        include,
        take: 8,
      });
      return { promo, products: products.map(toCardData) };
    })
  );

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
            {banners.slice(0, 2).map((b) => (
              <PromoTile
                key={b.id}
                promo={{ id: b.id, title: b.title, subtitle: b.subtitle, imageUrl: b.imageUrl, linkUrl: b.linkUrl }}
              />
            ))}
            {banners.length === 0 && (
              <div className="col-span-2 rounded-lg bg-white/5 aspect-[16/9] flex items-center justify-center text-white/40 text-sm">
                Promotional banners appear here once added from the admin dashboard.
              </div>
            )}
          </div>
        </div>
      </section>

      {saleCampaigns.length > 0 && (
        <section className="bg-[var(--brand-buy)]">
          <div className="container-page py-4 flex flex-wrap items-center gap-6">
            {saleCampaigns.map((c) => (
              <Link key={c.id} href={c.linkUrl ?? "/products"} className="flex items-center gap-2 text-white">
                <span className="font-bold text-sm uppercase">{c.title}</span>
                {c.subtitle && <span className="text-sm opacity-90">{c.subtitle}</span>}
              </Link>
            ))}
          </div>
        </section>
      )}

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

        {(dealPromos.length > 0 || deals.length > 0) && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--brand-buy)]">Today&apos;s Deals</h2>
              <Link href="/deals" className="text-sm text-[var(--brand-accent)] hover:underline font-medium">
                See all
              </Link>
            </div>
            {dealPromos.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                {dealPromos.map((d) => (
                  <PromoTile
                    key={d.id}
                    tone="light"
                    promo={{
                      id: d.id,
                      title: d.title,
                      subtitle: d.subtitle,
                      imageUrl: d.imageUrl,
                      linkUrl: d.linkUrl,
                      productSlug: d.product?.slug,
                    }}
                  />
                ))}
              </div>
            )}
            {deals.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {deals.map((p) => (
                  <ProductCard key={p.id} product={toCardData(p)} />
                ))}
              </div>
            )}
          </section>
        )}

        {featured.length > 0 && <ProductSection title="Featured Products" viewAllHref="/products?featured=true" products={featured.map(toCardData)} />}

        {featuredSections.map(({ promo, products }) =>
          products.length > 0 ? (
            <ProductSection
              key={promo.id}
              title={promo.title}
              subtitle={promo.subtitle}
              viewAllHref={promo.categoryId ? `/category/${promo.category?.slug}` : "/products"}
              products={products}
            />
          ) : promo.productId ? (
            <section key={promo.id} className="card-surface p-6 flex items-center justify-between gap-6 bg-[var(--brand-accent-light)]">
              <div>
                <h2 className="text-lg font-semibold">{promo.title}</h2>
                {promo.subtitle && <p className="text-sm text-[var(--text-muted)] mt-1">{promo.subtitle}</p>}
              </div>
              <Link href={promo.product ? `/products/${promo.product.slug}` : "/products"} className="btn-primary px-5 py-2.5 text-sm whitespace-nowrap">
                Shop Now
              </Link>
            </section>
          ) : null
        )}

        {bestSellers.length > 0 && <ProductSection title="Best Sellers" viewAllHref="/products?bestSeller=true" products={bestSellers.map(toCardData)} />}
        {newArrivals.length > 0 && <ProductSection title="New Arrivals" viewAllHref="/products?sort=newest" products={newArrivals.map(toCardData)} />}

        {featured.length === 0 && bestSellers.length === 0 && newArrivals.length === 0 && deals.length === 0 && dealPromos.length === 0 && (
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
  subtitle,
  viewAllHref,
  products,
  accent,
}: {
  title: string;
  subtitle?: string | null;
  viewAllHref: string;
  products: ProductCardData[];
  accent?: boolean;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <h2 className={`text-lg font-semibold ${accent ? "text-[var(--brand-buy)]" : ""}`}>{title}</h2>
          {subtitle && <p className="text-sm text-[var(--text-muted)] mt-0.5">{subtitle}</p>}
        </div>
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
