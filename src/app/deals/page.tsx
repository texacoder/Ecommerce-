import ProductCard from "@/components/ProductCard";
import PromoTile from "@/components/PromoTile";
import { getProductListing } from "@/lib/product-listing";
import { prisma } from "@/lib/db";

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const now = new Date();

  const [{ products, total }, dealPromos] = await Promise.all([
    getProductListing({ minDiscount: 1, sort: "price_asc", page }),
    prisma.promotion.findMany({
      where: {
        type: "DEAL",
        active: true,
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: { product: { select: { slug: true } } },
      orderBy: { position: "asc" },
    }),
  ]);

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-semibold mb-1 text-[var(--brand-buy)]">Today&apos;s Deals</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">{total} discounted products right now</p>

      {dealPromos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
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

      {products.length === 0 ? (
        <div className="card-surface p-10 text-center text-[var(--text-muted)]">No active deals right now — check back soon.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}
