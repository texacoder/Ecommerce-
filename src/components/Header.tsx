"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";

export default function Header() {
  const { user, loading, logout } = useAuth();
  const { totalCount } = useCart();
  const router = useRouter();
  const [q, setQ] = useState("");

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    router.push(q.trim() ? `/products?q=${encodeURIComponent(q.trim())}` : "/products");
  }

  return (
    <header className="border-b border-black/10 dark:border-white/10 sticky top-0 bg-[var(--background)] z-40">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-4">
        <Link href="/" className="font-bold text-lg shrink-0">
          Storefront
        </Link>
        <form onSubmit={onSearch} className="flex-1 max-w-md">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search products..."
            className="w-full border border-black/15 dark:border-white/20 rounded-full px-4 py-1.5 text-sm outline-none focus:border-black/40 dark:focus:border-white/40"
          />
        </form>
        <nav className="flex items-center gap-4 text-sm ml-auto">
          <Link href="/products" className="hover:underline">
            Shop
          </Link>
          <Link href="/cart" className="hover:underline">
            Cart{totalCount > 0 ? ` (${totalCount})` : ""}
          </Link>
          {!loading && user && user.role === "ADMIN" && (
            <Link href="/admin" className="hover:underline font-medium">
              Admin
            </Link>
          )}
          {!loading && user && (
            <>
              <Link href="/account" className="hover:underline">
                {user.name.split(" ")[0]}
              </Link>
              <button
                onClick={async () => {
                  await logout();
                  router.push("/");
                  router.refresh();
                }}
                className="hover:underline text-black/60 dark:text-white/60"
              >
                Log out
              </button>
            </>
          )}
          {!loading && !user && (
            <Link href="/login" className="hover:underline">
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
