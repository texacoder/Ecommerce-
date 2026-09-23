import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatMoney } from "@/lib/format";
import ProductPurchasePanel from "@/components/ProductPurchasePanel";
import ReviewsSection from "@/components/ReviewsSection";
import ProductGallery from "@/components/ProductGallery";
import StarRating from "@/components/StarRating";
import ProductCard, { type ProductCardData } from "@/components/ProductCard";
import ProductOptionsSelector from "@/components/ProductOptionsSelector";
import MetaProductViewTracker from "@/components/MetaProductViewTracker";
import { SITE_URL, isCrawlableImageUrl, structuredDataName } from "@/lib/seo";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await prisma.product.findFirst({
    where: { slug, deletedAt: null, status: "PUBLISHED", visible: true },
    select: {
      name: true,
      description: true,
      brand: true,
      images: { orderBy: { position: "asc" }, take: 1, select: { url: true } },
    },
  });
  if (!product) return {};

  const description = product.description
    ? product.description.slice(0, 160)
    : `Buy ${product.name}${product.brand ? ` by ${product.brand}` : ""} online at EXORASTORE.`;
  const image = product.images[0]?.url;
  // A child segment's own `openGraph`/`twitter` object replaces the root
  // layout's rather than merging field-by-field, so leaving `images`
  // undefined here would drop the site's default OG image entirely
  // instead of falling back to it - fall back explicitly instead.
  const ogImage = isCrawlableImageUrl(image) ? image : "/opengraph-image";

  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${slug}` },
    openGraph: {
      title: product.name,
      description,
      url: `/products/${slug}`,
      type: "website",
      images: [{ url: ogImage }],
    },
    twitter: {
      card: "summary_large_image",
      title: product.name,
      description,
      images: [ogImage],
    },
  };
}

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
      optionLinks: {
        where: { optionProduct: { deletedAt: null, status: "PUBLISHED", visible: true } },
        include: { optionProduct: { select: { id: true, slug: true, name: true, price: true } } },
      },
    },
  });
  if (!product) notFound();

  const session = await getSession();
  const hasPurchased = session
    ? Boolean(
        await prisma.orderItem.findFirst({
          where: {
            productId: product.id,
            order: { userId: session.sub, paymentStatus: "PAID", status: { not: "CANCELLED" } },
          },
        })
      )
    : false;

  const avgRating = product.reviews.length
    ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
    : null;
  let specs: Record<string, string> = {};
  if (product.specifications) {
    try {
      const parsed = JSON.parse(product.specifications);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) specs = parsed;
    } catch {
      // Specifications predates the key/value editor or was hand-edited into
      // invalid JSON - degrade to "no structured specs" rather than crashing
      // the page a shopper is trying to buy from.
    }
  }

  const related = product.categoryId
    ? await prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          deletedAt: null,
          status: "PUBLISHED",
          visible: true,
        },
        include: { images: { orderBy: { position: "asc" }, take: 1 }, _count: { select: { variants: true } } },
        take: 4,
      })
    : [];

  const relatedCards: ProductCardData[] = related.map((p) => ({
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
  }));

  const crawlableImages = product.images.map((i) => i.url).filter(isCrawlableImageUrl);
  const structuredProductName = structuredDataName(product.name);
  const structuredBrandName = structuredDataName(product.brand, 100);

  const productJsonLd = structuredProductName
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: structuredProductName,
        description: product.description ?? undefined,
        image: crawlableImages.length > 0 ? crawlableImages : undefined,
        sku: product.sku,
        brand: structuredBrandName ? { "@type": "Brand", name: structuredBrandName } : undefined,
        offers: {
          "@type": "Offer",
          url: `${SITE_URL}/products/${slug}`,
          priceCurrency: "INR",
          price: (product.price / 100).toFixed(2),
          availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
        ...(product.reviews.length > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: avgRating?.toFixed(1),
                reviewCount: product.reviews.length,
              },
            }
          : {}),
      }
    : null;

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Products", item: `${SITE_URL}/products` },
      ...(product.category
        ? [
            {
              "@type": "ListItem",
              position: 2,
              name: product.category.name,
              item: `${SITE_URL}/category/${product.category.slug}`,
            },
          ]
        : []),
      {
        "@type": "ListItem",
        position: product.category ? 3 : 2,
        name: structuredProductName ?? product.name,
        item: `${SITE_URL}/products/${slug}`,
      },
    ],
  };

  return (
    <div className="container-page py-8">
      {productJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
      )}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <MetaProductViewTracker id={product.id} name={product.name} price={product.price} />
      <div className="text-sm text-[var(--text-muted)] mb-4 flex gap-1">
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

      <div className="grid md:grid-cols-2 gap-10">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="flex gap-1.5 mb-2">
            {product.isNewArrival && <Badge label="New" color="bg-[var(--brand-accent)]" />}
            {product.isBestSeller && <Badge label="Best seller" color="bg-[var(--warning)]" />}
            {product.discountPercent ? <Badge label={`${product.discountPercent}% off`} color="bg-[var(--brand-buy)]" /> : null}
          </div>
          <h1 className="text-2xl font-semibold leading-snug">{product.name}</h1>
          {product.brand && <p className="text-[var(--text-muted)] text-sm mt-1">by {product.brand}</p>}
          <div className="mt-2">
            <StarRating rating={avgRating} count={product.reviews.length} size="md" />
          </div>

          <div className="flex items-baseline gap-3 mt-4">
            <span className="text-3xl font-bold">{formatMoney(product.price)}</span>
            {product.originalPrice && product.originalPrice > product.price && (
              <>
                <span className="text-[var(--text-faint)] line-through">{formatMoney(product.originalPrice)}</span>
                <span className="text-[var(--success)] text-sm font-medium">
                  Save {formatMoney(product.originalPrice - product.price)}
                </span>
              </>
            )}
          </div>
          <p className="text-xs text-[var(--text-faint)] mt-1">Inclusive of all taxes</p>
          <p className="text-xs mt-1 text-[var(--text-muted)]">
            {product.isReturnable ? "Eligible for 7-day returns" : "This item is not eligible for return"}
          </p>
          <p className="text-xs mt-1 text-[var(--text-muted)]">
            {product.codAvailable ? "Cash on Delivery available" : "Online payment only. Cash on Delivery not available"}
          </p>

          {product.description && <p className="mt-4 text-sm leading-relaxed text-[var(--text-muted)]">{product.description}</p>}

          {product.optionLinks.length > 0 && (
            <div className="mt-4">
              <ProductOptionsSelector
                current={{ id: product.id, slug: product.slug, name: product.name, price: product.price }}
                options={product.optionLinks.map((l) => l.optionProduct)}
              />
            </div>
          )}

          <div className="mt-6">
            <ProductPurchasePanel
              productId={product.id}
              slug={product.slug}
              name={product.name}
              image={product.images[0]?.url ?? null}
              basePrice={product.price}
              baseStock={product.stock}
              isReturnable={product.isReturnable}
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
                  <tr className="border-b border-[var(--border-subtle)]">
                    <td className="py-1.5 pr-4 text-[var(--text-muted)] w-1/3">SKU</td>
                    <td className="py-1.5">{product.sku}</td>
                  </tr>
                  {Object.entries(specs).map(([k, v]) => (
                    <tr key={k} className="border-b border-[var(--border-subtle)]">
                      <td className="py-1.5 pr-4 text-[var(--text-muted)] w-1/3">{k}</td>
                      <td className="py-1.5">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {relatedCards.length > 0 && (
        <div className="mt-14">
          <h2 className="text-lg font-semibold mb-4">Related Products</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {relatedCards.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-14">
        <ReviewsSection
          productId={product.id}
          hasPurchased={hasPurchased}
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
