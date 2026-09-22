import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import PromoTile from "@/components/PromoTile";
import HeroCarousel, { type HeroSlide } from "@/components/HeroCarousel";
import { SITE_NAME, SITE_URL } from "@/lib/seo";
import { optimizedImageUrl } from "@/lib/image";

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

// Plain helper (not inline in the component body) so the randomness doesn't
// trip React's rule against impure calls inside a component's render.
function randomSkip(exclusiveMax: number): number {
  return Math.floor(Math.random() * exclusiveMax);
}

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
        include: { product: { select: { slug: true, status: true, visible: true, deletedAt: true } } },
        orderBy: { position: "asc" },
        take: 4,
      }),
      prisma.promotion.findMany({
        where: { type: "FEATURED_SECTION", ...activePromotionWhere(now) },
        include: {
          product: { select: { slug: true, status: true, visible: true, deletedAt: true } },
          category: { select: { slug: true, visible: true } },
        },
        orderBy: { position: "asc" },
      }),
    ]);

  // A promo can keep pointing at a product/category after it's been
  // unpublished, hidden, or soft-deleted (unpublishing doesn't clear the
  // promo's productId) — drop that reference here so the homepage never
  // links out to a product page that will 404.
  const isVisibleProduct = (p: { status: string; visible: boolean; deletedAt: Date | null } | null | undefined) =>
    !!p && p.status === "PUBLISHED" && p.visible && !p.deletedAt;
  // Filtered here (not just inside PromoTile) so an imageless promo's
  // wrapper element never gets created at all, rather than rendering an
  // empty box that still takes up a slot in the row/grid.
  const validDealPromos = dealPromos
    .filter((d) => d.imageUrl)
    .map((d) => ({
      ...d,
      product: isVisibleProduct(d.product) ? d.product : null,
    }));

  // FEATURED_SECTION promotions can be scoped to a category (render that
  // category's products) or left as a standalone spotlight banner. A
  // category scope includes its subcategories' products too — products are
  // normally assigned to leaf subcategories, not the parent, so a promo
  // scoped to a parent category (e.g. "Electronics") would otherwise match
  // nothing even though it obviously should include "Headphones", etc.
  const validFeaturedSectionPromos = featuredSectionPromos.map((promo) => ({
    ...promo,
    product: isVisibleProduct(promo.product) ? promo.product : null,
    category: promo.category?.visible ? promo.category : null,
  }));

  const featuredSections = await Promise.all(
    validFeaturedSectionPromos.map(async (promo) => {
      if (!promo.categoryId || !promo.category) return { promo, products: [] as ProductCardData[] };
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

  // No admin banners set up yet - fill that hero space with a few random
  // products instead of a "nothing here" placeholder, so the homepage
  // never looks empty even before any promotions are configured.
  let fallbackHeroProducts: ProductCardData[] = [];
  if (banners.length === 0) {
    const eligibleCount = await prisma.product.count({ where: baseWhere });
    if (eligibleCount > 0) {
      const skip = eligibleCount > 3 ? randomSkip(eligibleCount - 3) : 0;
      const randomProducts = await prisma.product.findMany({ where: baseWhere, include, take: 3, skip });
      fallbackHeroProducts = randomProducts.map(toCardData);
    }
  }

  // The hero carousel shows admin-managed BANNER promotions when any exist,
  // falling back to a few random products' own photos otherwise - either
  // way it's just a flat list of {id, imageUrl, linkUrl}.
  const heroSlides: HeroSlide[] =
    banners.length > 0
      ? banners.filter((b) => b.imageUrl).map((b) => ({ id: b.id, imageUrl: b.imageUrl as string, linkUrl: b.linkUrl }))
      : fallbackHeroProducts
          .filter((p) => p.image)
          .map((p) => ({ id: p.id, imageUrl: p.image as string, linkUrl: `/products/${p.slug}` }));

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: SITE_NAME,
        url: SITE_URL,
        logo: `${SITE_URL}/logo-mark-96.png`,
      },
      {
        "@type": "WebSite",
        name: SITE_NAME,
        url: SITE_URL,
        potentialAction: {
          "@type": "SearchAction",
          target: `${SITE_URL}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <div className="flex flex-col">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <section className="relative bg-[var(--brand-navy)] overflow-hidden">
        <HeroCarousel slides={heroSlides} />
        {heroSlides.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        )}
        <div className="container-page relative z-10 py-10 sm:py-16">
          <div className="max-w-xl text-white">
            <p className="text-[var(--brand-accent)] font-semibold text-sm uppercase tracking-wide mb-3">EXORASTORE —</p>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
              Everything You Need,
              <br />
              <span className="text-[var(--brand-accent)]">Delivered to Your Door.</span>
            </h1>
            <p className="text-white/80 mb-7 max-w-md">
              Electronics, fashion, home essentials, beauty and more — all in one place, at prices that make sense.
            </p>
            <div className="flex flex-wrap items-center gap-5 mb-9">
              <Link href="/products" className="btn-primary inline-flex items-center gap-1.5 px-6 py-3 text-sm">
                Shop Now <span aria-hidden>→</span>
              </Link>
              <Link href="/deals" className="text-[var(--brand-accent)] font-medium text-sm inline-flex items-center gap-1.5 hover:underline">
                Explore Deals <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
              <TrustBadge icon="truck" label="Free Shipping" sub="Above ₹499" />
              <TrustBadge icon="shield" label="Secure" sub="Payments" />
              <TrustBadge icon="package" label="Easy" sub="Returns" />
              <TrustBadge icon="headset" label="24/7" sub="Support" />
            </div>
            {heroSlides.length === 0 && (
              <p className="text-white/40 text-xs mt-6">Add a homepage banner image in Admin → Promotions for a background photo here.</p>
            )}
          </div>
        </div>
        {heroSlides.length > 0 && (
          <p className="hidden lg:block absolute right-6 top-1/2 -translate-y-1/2 z-10 text-white/60 italic text-sm tracking-wide rotate-90 whitespace-nowrap">
            More Than Just a Store
          </p>
        )}
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
            <div className="flex overflow-x-auto gap-3 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-4 md:grid-cols-8 sm:overflow-visible">
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  className="card-surface hover:shadow-md transition-shadow p-3 text-center flex flex-col items-center gap-2 w-20 shrink-0 sm:w-auto"
                >
                  {c.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={optimizedImageUrl(c.imageUrl, 96)}
                      alt={c.name}
                      loading="lazy"
                      decoding="async"
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-12 h-12 rounded-full bg-[var(--surface-muted)]" />
                  )}
                  <span className="text-xs font-medium leading-tight">{c.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {(validDealPromos.length > 0 || deals.length > 0) && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--brand-buy)]">Today&apos;s Deals</h2>
              <Link href="/deals" className="text-sm text-[var(--brand-accent)] hover:underline font-medium">
                See all
              </Link>
            </div>
            {/* Mobile: promo tiles and real products are different heights
                (a plain image vs. a full price/rating/button card), so
                mixing them into one scroll row leaves an odd gap under the
                shorter tiles - two separate rows keep each one's height
                consistent. Desktop keeps the original single merged grid
                (unchanged) since wrapping to multiple items per line there
                doesn't have this problem. */}
            {validDealPromos.length > 0 && (
              <div className="flex sm:hidden overflow-x-auto gap-4 pb-1 -mx-4 px-4 mb-4">
                {validDealPromos.map((d) => (
                  <div key={d.id} className="w-40 shrink-0">
                    <PromoTile
                      promo={{
                        id: d.id,
                        title: d.title,
                        subtitle: d.subtitle,
                        imageUrl: d.imageUrl,
                        linkUrl: d.linkUrl,
                        productSlug: d.product?.slug,
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {deals.length > 0 && (
              <div className="flex sm:hidden overflow-x-auto gap-4 pb-1 -mx-4 px-4">
                {deals.map((p) => (
                  <div key={p.id} className="w-40 shrink-0">
                    <ProductCard product={toCardData(p)} />
                  </div>
                ))}
              </div>
            )}
            <div className="hidden sm:grid sm:grid-cols-3 md:grid-cols-4 gap-4">
              {validDealPromos.map((d) => (
                <PromoTile
                  key={d.id}
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
              {deals.map((p) => (
                <ProductCard key={p.id} product={toCardData(p)} />
              ))}
            </div>
          </section>
        )}

        {featured.length > 0 && <ProductSection title="Featured Products" viewAllHref="/products?featured=true" products={featured.map(toCardData)} />}

        {featuredSections.map(({ promo, products }) =>
          products.length > 0 ? (
            <ProductSection
              key={promo.id}
              title={promo.title}
              subtitle={promo.subtitle}
              viewAllHref={promo.category ? `/category/${promo.category.slug}` : "/products"}
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

        {featured.length === 0 && bestSellers.length === 0 && newArrivals.length === 0 && deals.length === 0 && validDealPromos.length === 0 && (
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
      <div className="flex overflow-x-auto gap-4 pb-1 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 sm:overflow-visible">
        {products.map((p) => (
          <div key={p.id} className="w-40 shrink-0 sm:w-auto">
            <ProductCard product={p} />
          </div>
        ))}
      </div>
    </section>
  );
}

type TrustIconName = "truck" | "shield" | "package" | "headset";

function TrustBadge({ icon, label, sub }: { icon: TrustIconName; label: string; sub: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-blue-400 shrink-0">
        <TrustIcon name={icon} />
      </span>
      <span className="text-xs leading-tight text-white">
        <span className="block font-medium">{label}</span>
        <span className="block text-white/60">{sub}</span>
      </span>
    </div>
  );
}

function TrustIcon({ name }: { name: TrustIconName }) {
  const common = {
    xmlns: "http://www.w3.org/2000/svg",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.5,
    className: "w-5 h-5",
  };
  switch (name) {
    case "truck":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
          <circle cx="7" cy="18" r="1.5" />
          <circle cx="17" cy="18" r="1.5" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
        </svg>
      );
    case "package":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7M12 11v10" />
        </svg>
      );
    case "headset":
      return (
        <svg {...common}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 13v-1a8 8 0 0116 0v1" />
          <rect x="3" y="13" width="4" height="6" rx="1.5" />
          <rect x="17" y="13" width="4" height="6" rx="1.5" />
        </svg>
      );
  }
}
