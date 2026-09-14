import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import ProductCard from "@/components/ProductCard";
import { getProductListing } from "@/lib/product-listing";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sort?: string; page?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const category = await prisma.category.findFirst({
    where: { slug, visible: true },
    include: { children: { where: { visible: true } } },
  });
  if (!category) notFound();

  const page = Number(sp.page ?? "1") || 1;
  const { products, total, pageCount } = await getProductListing({ category: slug, sort: sp.sort, page });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold mb-2">{category.name}</h1>
      {category.description && <p className="text-black/60 dark:text-white/60 mb-4">{category.description}</p>}

      {category.children.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {category.children.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="text-sm px-3 py-1 rounded-full border border-black/15 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10">
              {c.name}
            </Link>
          ))}
        </div>
      )}

      <p className="text-sm text-black/40 dark:text-white/40 mb-4">{total} products</p>

      {products.length === 0 ? (
        <p className="text-black/60 dark:text-white/60">No products in this category yet.</p>
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
            <Link key={p} href={`/category/${slug}?page=${p}`} className={`px-3 py-1 rounded border ${p === page ? "border-black dark:border-white font-semibold" : "border-black/15 dark:border-white/20"}`}>
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
