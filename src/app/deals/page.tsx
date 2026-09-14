import ProductCard from "@/components/ProductCard";
import { getProductListing } from "@/lib/product-listing";

export default async function DealsPage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const { products, total } = await getProductListing({ minDiscount: 1, sort: "price_asc", page });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-semibold mb-1 text-[var(--brand-buy)]">Today&apos;s Deals</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">{total} discounted products right now</p>

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
