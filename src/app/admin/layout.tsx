import { redirect } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/inventory", label: "Inventory" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/promotions", label: "Promotions" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already blocks non-admins from /admin, but
  // every render re-checks the database directly too (session claims alone
  // are never trusted for a role that may have changed since login).
  const session = await getSession();
  if (!session) redirect("/login?next=/admin");
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user || user.role !== "ADMIN" || user.status === "SUSPENDED") redirect("/");

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 flex gap-8">
      <aside className="w-48 shrink-0">
        <nav className="flex flex-col gap-1 sticky top-20">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="px-3 py-2 rounded text-sm hover:bg-black/5 dark:hover:bg-white/10">
              {item.label}
            </Link>
          ))}
          <Link href="/" className="px-3 py-2 rounded text-sm text-black/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/10 mt-4">
            ← Back to store
          </Link>
        </nav>
      </aside>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
