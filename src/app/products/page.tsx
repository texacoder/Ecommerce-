import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProductListing } from "@/lib/product-listing";
import { prisma } from "@/lib/db";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; sort?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const page = Number(sp.page ?? "1") || 1;
  const [{ products, total, pageCount }, categories] = await Promise.all([
    getProductListing({ q: sp.q, category: sp.category, sort: sp.sort, page }),
    prisma.category.findMany({ where: { visible: true }, orderBy: { name: "asc" } }),
  ]);

  function pageHref(p: number) {
    const params = new URLSearchParams();
    if (sp.q) params.set("q", sp.q);
    if (sp.category) params.set("category", sp.category);
    if (sp.sort) params.set("sort", sp.sort);
    params.set("page", String(p));
    return `/products?${params.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold mr-auto">
          {sp.q ? `Results for "${sp.q}"` : "All products"} <span className="text-black/40 dark:text-white/40 text-sm">({total})</span>
        </h1>
        <form method="get" className="flex gap-2 text-sm">
          {sp.q && <input type="hidden" name="q" value={sp.q} />}
          <select name="category" defaultValue={sp.category ?? ""} className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
          <select name="sort" defaultValue={sp.sort ?? "newest"} className="border border-black/15 dark:border-white/20 rounded px-2 py-1 bg-transparent">
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="name">Name</option>
          </select>
          <button type="submit" className="border border-black/20 dark:border-white/20 rounded px-3 py-1 hover:bg-black/5 dark:hover:bg-white/10">
            Apply
          </button>
        </form>
      </div>

      {products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No products found.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
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
              className={`px-3 py-1 rounded border ${p === page ? "border-black dark:border-white font-semibold" : "border-black/15 dark:border-white/20"}`}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
