import Link from "next/link";
import { getAnalyticsData } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";
import { RevenueChart, OrderStatusChart } from "@/components/admin/AdminCharts";

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
        <div className="card-surface p-4">
          <h2 className="font-semibold mb-3">Revenue, last 30 days</h2>
          <RevenueChart data={data.revenueOverTime} />
        </div>

        <div className="card-surface p-4">
          <h2 className="font-semibold mb-3">Orders by status</h2>
          <OrderStatusChart data={data.orderStatusDistribution} />
        </div>

        <div className="card-surface p-4">
          <h2 className="font-semibold mb-3">Best-selling products</h2>
          {data.bestSellers.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">No sales yet.</p>
          ) : (
            <ul className="text-sm flex flex-col gap-2">
              {data.bestSellers.map((p) => (
                <li key={p.productId} className="flex justify-between">
                  <span>{p.name}</span>
                  <span className="text-[var(--text-muted)]">{p.quantity} sold</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card-surface p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold">Low stock products</h2>
            <Link href="/admin/inventory" className="text-sm text-[var(--brand-accent)] hover:underline">
              Manage inventory
            </Link>
          </div>
          {data.lowStockProducts.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">Nothing running low.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[var(--text-muted)]">
                  <th className="py-1">Product</th>
                  <th className="py-1">SKU</th>
                  <th className="py-1 text-right">Stock</th>
                </tr>
              </thead>
              <tbody>
                {data.lowStockProducts.map((p) => (
                  <tr key={p.id} className="border-t border-[var(--border-subtle)]">
                    <td className="py-1.5">{p.name}</td>
                    <td className="py-1.5">{p.sku}</td>
                    <td className={`py-1.5 text-right ${p.stock === 0 ? "text-[var(--danger)] font-medium" : "text-[var(--warning)]"}`}>{p.stock}</td>
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
    <div className={`card-surface p-4 ${highlight ? "border-[var(--warning)]" : ""}`}>
      <p className="text-xs text-[var(--text-muted)]">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
