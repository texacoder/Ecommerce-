import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import ProductFilters from "@/components/ProductFilters";
import { getProductListing } from "@/lib/product-listing";

type SearchParams = {
  sort?: string;
  page?: string;
  priceMin?: string;
  priceMax?: string;
  brand?: string;
  minRating?: string;
  inStockOnly?: string;
  minDiscount?: string;
};

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await prisma.category.findFirst({
    where: { slug, visible: true },
    include: { children: { where: { visible: true } } },
  });
  if (!category) notFound();

  const page = Number(sp.page ?? "1") || 1;
  const categoryIds = [category.id, ...category.children.map((c) => c.id)];
  const { products, total, pageCount, availableBrands } = await getProductListing({
    categoryIds,
    sort: sp.sort,
    page,
    priceMin: sp.priceMin ? Number(sp.priceMin) * 100 : undefined,
    priceMax: sp.priceMax ? Number(sp.priceMax) * 100 : undefined,
    brand: sp.brand,
    minRating: sp.minRating ? Number(sp.minRating) : undefined,
    inStockOnly: sp.inStockOnly === "true",
    minDiscount: sp.minDiscount ? Number(sp.minDiscount) : undefined,
  });

  return (
    <div className="container-page py-8">
      <h1 className="text-2xl font-semibold mb-2">{category.name}</h1>
      {category.description && <p className="text-[var(--text-muted)] mb-4">{category.description}</p>}

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="text-sm px-3 py-1 rounded-full border border-[var(--border-subtle)] hover:bg-[var(--surface-muted)]">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <div className="grid md:grid-cols-[240px_1fr] gap-6">
        <aside>
          <ProductFilters action={`/category/${slug}`} filters={sp} brands={availableBrands} />
        </aside>
        <div>
          <p className="text-sm text-[var(--text-muted)] mb-4">{total} products</p>

          {products.length === 0 ? (
            <div className="card-surface p-10 text-center text-[var(--text-muted)]">No products in this category yet.</div>
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
                <Link key={p} href={`/category/${slug}?page=${p}`} className={`px-3 py-1.5 rounded border ${p === page ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] font-semibold" : "border-[var(--border-subtle)]"}`}>
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
