import Link from "next/link";
import type { Metadata } from "next";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { getProductListing } from "@/lib/product-listing";
import { prisma } from "@/lib/db";

type SearchParams = {
  q?: string;
  sort?: string;
  page?: string;
  priceMin?: string;
  priceMax?: string;
  brand?: string;
  minRating?: string;
  inStockOnly?: string;
  minDiscount?: string;
  category?: string;
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const sp = await searchParams;
  return {
    title: sp.q ? `Search results for "${sp.q}"` : "Search",
    // Internal search result pages are thin/duplicate by nature (the same
    // catalog sliced a different way for every query) - Google's own
    // guidance is to keep them out of the index but still let links from
    // them be followed/crawled, rather than blocking the page outright.
    robots: { index: false, follow: true },
  };
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
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
    }),
    prisma.category.findMany({ where: { visible: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="container-page py-8 grid md:grid-cols-[240px_1fr] gap-6">
      <aside>
        <ProductFilters action="/search" filters={sp} brands={availableBrands} categories={categories} />
      </aside>

      <div>
        <h1 className="text-xl font-semibold mb-1">
          {sp.q ? (
            <>
              Search results for <span className="text-[var(--brand-accent)]">&quot;{sp.q}&quot;</span>
            </>
          ) : (
            "Search"
          )}
        </h1>
        <p className="text-sm text-[var(--text-muted)] mb-6">{total} results</p>

        {products.length === 0 ? (
          <div className="card-surface p-10 text-center text-[var(--text-muted)]">
            <p className="font-medium mb-1">No results found{sp.q ? ` for "${sp.q}"` : ""}</p>
            <p className="text-sm mb-4">Try a different search term, or browse a category below.</p>
            <Link href="/products" className="text-[var(--brand-accent)] hover:underline text-sm font-medium">
              Browse all products
            </Link>
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
            {Array.from({ length: pageCount }, (_, i) => i + 1).map((p) => {
              const params = new URLSearchParams();
              Object.entries(sp).forEach(([k, v]) => {
                if (v && k !== "page") params.set(k, v);
              });
              params.set("page", String(p));
              return (
                <Link key={p} href={`/search?${params.toString()}`} className="px-3 py-1.5 rounded border border-[var(--border-subtle)]">
                  {p}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
