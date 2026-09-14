import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney, formatDate } from "@/lib/format";
import ProductRowActions from "@/components/admin/ProductRowActions";

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const sp = await searchParams;
  const products = await prisma.product.findMany({
    where: {
      deletedAt: null,
      ...(sp.q ? { OR: [{ name: { contains: sp.q } }, { sku: { contains: sp.q } }] } : {}),
    },
    include: { category: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Products</h1>
        <Link href="/admin/products/new" className="rounded-md bg-black text-white dark:bg-white dark:text-black px-4 py-2 text-sm font-medium">
          + New product
        </Link>
      </div>

      <form method="get" className="mb-4">
        <input name="q" defaultValue={sp.q ?? ""} placeholder="Search by name or SKU" className="border border-black/15 dark:border-white/20 rounded px-3 py-1.5 text-sm bg-transparent w-64" />
      </form>

      <div className="border border-black/10 dark:border-white/10 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-black/5 dark:bg-white/5">
              <th className="p-3">Name</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Price</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
              <th className="p-3">Updated</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-black/5 dark:border-white/10">
                <td className="p-3">
                  <Link href={`/admin/products/${p.id}`} className="hover:underline font-medium">
                    {p.name}
                  </Link>
                  <div className="flex gap-1 mt-1">
                    {p.isFeatured && <Tag label="Featured" />}
                    {p.isBestSeller && <Tag label="Best seller" />}
                    {p.isNewArrival && <Tag label="New" />}
                    {!p.visible && <Tag label="Hidden" />}
                  </div>
                </td>
                <td className="p-3">{p.sku}</td>
                <td className="p-3">{p.category?.name ?? "—"}</td>
                <td className="p-3">{formatMoney(p.price)}</td>
                <td className={`p-3 ${p.stock === 0 ? "text-rose-600" : ""}`}>{p.stock}</td>
                <td className="p-3">{p.status}</td>
                <td className="p-3 text-black/50 dark:text-white/50">{formatDate(p.updatedAt)}</td>
                <td className="p-3">
                  <ProductRowActions productId={p.id} status={p.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-center text-black/50 dark:text-white/50">No products found.</p>}
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return <span className="text-[10px] bg-black/10 dark:bg-white/10 rounded px-1.5 py-0.5">{label}</span>;
}
