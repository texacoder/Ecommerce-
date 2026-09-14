import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { getProductListing } from "@/lib/product-listing";
import { prisma } from "@/lib/db";

type SearchParams = {
  q?: string;
  category?: string;
  sort?: string;
  page?: string;
  priceMin?: string;
  priceMax?: string;
  brand?: string;
  minRating?: string;
  inStockOnly?: string;
  minDiscount?: string;
  featured?: string;
  bestSeller?: string;
};

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;

  const [{ products, total, pageCount, availableBrands }, categories] = await Promise.all([
    getProductListing({
      q: sp.q,
      category: sp.category,
      sort: sp.sort,
      page,
      priceMin: sp.priceMin ? Number(sp.priceMin) * 100 : undefined,
      priceMax: sp.priceMax ? Number(sp.priceMax) * 100 : undefined,
      brand: sp.brand,
      minRating: sp.minRating ? Number(sp.minRating) : undefined,
      inStockOnly: sp.inStockOnly === "true",
      minDiscount: sp.minDiscount ? Number(sp.minDiscount) : undefined,
      featured: sp.featured === "true",
      bestSeller: sp.bestSeller === "true",
    }),
    prisma.category.findMany({ where: { visible: true }, orderBy: { name: "asc" } }),
  ]);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    Object.entries(sp).forEach(([k, v]) => {
      if (v && k !== "page") params.set(k, v);
    });
    params.set("page", String(p));
    return `/products?${params.toString()}`;
  }

  return (
    <div className="container-page py-8 grid md:grid-cols-[240px_1fr] gap-6">
      <aside>
        <ProductFilters action="/products" filters={sp} brands={availableBrands} categories={categories} />
      </aside>

      <div>
        <h1 className="text-xl font-semibold mb-1">
          {sp.q ? `Results for "${sp.q}"` : "All Products"}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">{total} products found</p>

        {products.length === 0 ? (
          <div className="card-surface p-10 text-center text-[var(--text-muted)]">
            <p className="font-medium mb-1">No products match your filters</p>
            <p className="text-sm">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}

        {pageCount > 1 && (
          <div className="flex gap-2 justify-center mt-8 text-sm">
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={pageHref(p)}
                className={`px-3 py-1.5 rounded border ${p === page ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] font-semibold" : "border-[var(--border-subtle)]"}`}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
