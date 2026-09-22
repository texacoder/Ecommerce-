import Link from "next/link";
import { prisma } from "@/lib/db";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import PromoTile from "@/components/PromoTile";
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

export default async function HomePage() {
  const now = new Date();
  const baseWhere = { deletedAt: null, status: "PUBLISHED" as const, visible: true };
  const include = {
    images: { orderBy: { position: "asc" as const }, take: 1 },
    _count: { select: { variants: true } },
    reviews: { where: { status: "PUBLISHED" as const }, select: { rating: true } },
  };

  const [featured, newArrivals, bestSellers, deals, categories, saleCampaigns, dealPromos, featuredSectionPromos] =
    await Promise.all([
      prisma.product.findMany({ where: { ...baseWhere, isFeatured: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
      prisma.product.findMany({ where: { ...baseWhere, isNewArrival: true }, include, take: 8, orderBy: { createdAt: "desc" } }),
      prisma.product.findMany({ where: { ...baseWhere, isBestSeller: true }, include, take: 8, orderBy: { updatedAt: "desc" } }),
      prisma.product.findMany({ where: { ...baseWhere, discountPercent: { gte: 15 } }, include, take: 8, orderBy: { discountPercent: "desc" } }),
      prisma.category.findMany({ where: { visible: true, parentId: null }, take: 8, orderBy: { name: "asc" } }),
      prisma.promotion.findMany({ where: { type: "SALE_CAMPAIGN", ...activePromotionWhere(now) }, orderBy: { position: "asc" }, take: 3 }),
      prisma.promotion.findMany({
        where: { type: "DEAL", ...activePromotionWhere(now) },
        include: {
          product: {
            select: {
              id: true,
              slug: true,
              name: true,
              price: true,
              originalPrice: true,
              discountPercent: true,
              stock: true,
              isNewArrival: true,
              isBestSeller: true,
              status: true,
              visible: true,
              deletedAt: true,
              images: { orderBy: { position: "asc" }, take: 1 },
              _count: { select: { variants: true } },
              reviews: { where: { status: "PUBLISHED" }, select: { rating: true } },
            },
          },
        },
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
  // A DEAL promo tied to a real, visible product renders as a full product
  // card (photo, price, rating, Add to Cart) instead of just a clickable
  // promo image - consistent with every other product listing on the site.
  // Only a promo with no product at all (a pure promotional graphic) still
  // falls back to the plain image tile, and only if it has an image to show.
  const dealProductCards: ProductCardData[] = dealPromos
    .filter((d) => isVisibleProduct(d.product))
    .map((d) => toCardData(d.product as RawProduct));
  const dealImageOnlyPromos = dealPromos.filter((d) => !d.productId && d.imageUrl);
  // A product promoted via a DEAL promo can also independently qualify for
  // the plain discount-based query below - drop it from that second list so
  // it never renders as two identical cards in the same section.
  const dealPromoProductIds = new Set(dealProductCards.map((p) => p.id));
  const additionalDeals = deals.filter((p) => !dealPromoProductIds.has(p.id));

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
      <section className="relative bg-[var(--brand-navy)] overflow-hidden aspect-[4/5] sm:aspect-[12/5] flex items-center">
        {/* Two hand-cropped images, not one image force-cropped by CSS: the
            mobile (4:5) and desktop (12:5) shapes are different enough that
            no single crop covers both without either cutting off products or
            leaving empty bars. <picture>'s media-query source is what makes
            the browser fetch only the one it actually needs, unlike two
            <img> tags toggled with CSS (which many browsers still both
            download). The wrapping div's aspect-ratio matches each image's
            real shape exactly, so object-cover here never crops anything -
            it's just filling a box that's already the image's own shape. */}
        <picture>
          <source media="(min-width: 640px)" srcSet="/hero-banner-desktop.webp" />
          <img
            src="/hero-banner-mobile.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-black/20" />
        <div className="container-page relative z-10 py-10 sm:py-16">
          <div className="max-w-xl text-white" style={{ textShadow: "0 2px 10px rgba(0,0,0,0.85)" }}>
            <p className="text-[var(--brand-accent)] font-semibold text-sm uppercase tracking-wide mb-3">EXORASTORE</p>
            <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">
              Everything You Need,
              <br />
              <span className="text-[var(--brand-accent)]">Delivered to Your Door.</span>
            </h1>
            <p className="text-white/80 mb-7 max-w-md">
              Electronics, fashion, home essentials, beauty and more, all in one place, at prices that make sense.
            </p>
            <div className="flex flex-wrap items-center gap-5 mb-9">
              <Link href="/products" className="btn-primary inline-flex items-center gap-1.5 px-6 py-3 text-sm">
                Shop Now <span aria-hidden>→</span>
              </Link>
              <Link
                href="/deals"
                className="bg-white/10 hover:bg-white/20 border border-white/40 text-white font-medium text-sm inline-flex items-center gap-1.5 px-5 py-3 rounded-md backdrop-blur-sm"
              >
                Explore Deals <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-lg">
              <TrustBadge icon="truck" label="Free Shipping" sub="Above ₹999" />
              <TrustBadge icon="shield" label="Secure" sub="Payments" />
              <TrustBadge icon="package" label="Easy" sub="Returns" />
              <TrustBadge icon="headset" label="24/7" sub="Support" />
            </div>
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

        {(dealImageOnlyPromos.length > 0 || dealProductCards.length > 0 || additionalDeals.length > 0) && (
          <section>
            <div className="flex items-baseline justify-between mb-4">
              <h2 className="text-lg font-semibold text-[var(--brand-buy)]">Today&apos;s Deals</h2>
              <Link href="/deals" className="text-sm text-[var(--brand-accent)] hover:underline font-medium">
                See all
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
              {dealImageOnlyPromos.map((d) => (
                <PromoTile
                  key={d.id}
                  promo={{
                    id: d.id,
                    title: d.title,
                    subtitle: d.subtitle,
                    imageUrl: d.imageUrl,
                    linkUrl: d.linkUrl,
                  }}
                />
              ))}
              {dealProductCards.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
              {additionalDeals.map((p) => (
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

        {featured.length === 0 &&
          bestSellers.length === 0 &&
          newArrivals.length === 0 &&
          additionalDeals.length === 0 &&
          dealProductCards.length === 0 &&
          dealImageOnlyPromos.length === 0 && (
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
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
