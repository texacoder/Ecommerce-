import Link from "next/link";
import { getAnalyticsData } from "@/lib/analytics";
import { formatMoney, formatDate } from "@/lib/format";

export default async function AdminDashboardPage() {
  const data = await getAnalyticsData();

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Stat label="Total revenue" value={formatMoney(data.totalRevenue)} />
        <Stat label="Orders" value={String(data.orderCount)} />
        <Stat label="Average order value" value={formatMoney(data.averageOrderValue)} />
        <Stat label="Customers" value={String(data.customerCount)} />
        <Stat label="Products sold" value={String(data.productsSold)} />
        <Stat label="Pending orders" value={String(data.pendingOrders)} highlight={data.pendingOrders > 0} />
        <Stat label="Low stock products" value={String(data.lowStockProducts.length)} highlight={data.lowStockProducts.length > 0} />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Revenue, last 30 days</h2>
          {data.revenueOverTime.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50">No revenue yet.</p>
          ) : (
            <div className="flex items-end gap-1 h-32">
              {data.revenueOverTime.map((d) => {
                const max = Math.max(...data.revenueOverTime.map((r) => r.revenue), 1);
                return (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-1" title={`${formatDate(d.date)}: ${formatMoney(d.revenue)}`}>
                    <div className="w-full bg-black dark:bg-white rounded-t" style={{ height: `${(d.revenue / max) * 100}%`, minHeight: 2 }} />
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="border border-black/10 dark:border-white/10 rounded-lg p-4">
          <h2 className="font-semibold mb-3">Best-selling products</h2>
          {data.bestSellers.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50">No sales yet.</p>
          ) : (
            <ul className="text-sm flex flex-col gap-2">
              {data.bestSellers.map((p) => (
                <li key={p.productId} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-black/50 dark:text-white/50">{p.quantity} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="border border-black/10 dark:border-white/10 rounded-lg p-4 md:col-span-2">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Low stock products</h2>
            <Link href="/admin/inventory" className="text-sm underline">
              Manage inventory
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-black/50 dark:text-white/50">Nothing running low.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-black/50 dark:text-white/50">
                  <th className="py-1">Product</th>
                  <th className="py-1">SKU</th>
                  <th className="py-1 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-t border-black/5 dark:border-white/10">
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5">{p.sku}</td>
                    <td className={`py-1.5 text-right ${p.stock === 0 ? "text-rose-600 font-medium" : "text-amber-600"}`}>{p.stock}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`border rounded-lg p-4 ${highlight ? "border-amber-500/50 bg-amber-500/5" : "border-black/10 dark:border-white/10"}`}>
      <p className="text-xs text-black/50 dark:text-white/50">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
