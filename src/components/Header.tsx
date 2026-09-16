"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useCart } from "@/lib/cart-context";
import SearchBar from "@/components/SearchBar";

type NavCategory = { id: string; name: string; slug: string };

export default function Header({ categories }: { categories: NavCategory[] }) {
  const { user, loading, logout } = useAuth();
  const { totalCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);

  const navLinkClass = (href: string) =>
    `px-4 py-2.5 hover:bg-[var(--surface-muted)] ${pathname === href ? "bg-[var(--surface-muted)] font-semibold" : ""}`;

  return (
    <header className="sticky top-0 z-40">
      {/* Top bar */}
      <div className="bg-[var(--brand-navy)] text-white">
        <div className="container-page flex items-center gap-3 py-2.5">
          <button
            className="md:hidden p-1.5 -ml-1.5"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen((v) => !v)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-6 h-6">
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
          </button>

          <Link href="/" className="shrink-0 flex items-baseline gap-1">
            <span className="text-xl font-extrabold tracking-tight">NEXORA</span>
          </Link>

          <div className="hidden md:block">
            <button
              onClick={() => setCategoryMenuOpen((v) => !v)}
              className="flex items-center gap-1 text-sm px-2 py-2 rounded hover:bg-[var(--brand-navy-light)] whitespace-nowrap"
            >
              All Categories
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="hidden sm:block flex-1">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-3 sm:gap-4 text-sm ml-auto shrink-0">
            {!loading && user ? (
              <div className="hidden sm:block relative">
                <button onClick={() => setAccountMenuOpen((v) => !v)} className="block leading-tight hover:underline text-left">
                  <span className="text-[11px] text-white/70">Hello, {user.name.split(" ")[0]}</span>
                  <span className="block font-medium">Account</span>
                </button>
                {accountMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setAccountMenuOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 top-full mt-1 z-40 bg-white shadow-lg border border-[var(--border-subtle)] rounded-md w-48 py-2 text-[var(--text)]">
                      <Link href="/account" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-[var(--surface-muted)]">
                        My Account
                      </Link>
                      <Link href="/account/orders" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm hover:bg-[var(--surface-muted)]">
                        My Orders
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link href="/admin" onClick={() => setAccountMenuOpen(false)} className="block px-4 py-2 text-sm font-semibold hover:bg-[var(--surface-muted)]">
                          Admin Dashboard
                        </Link>
                      )}
                      <button
                        onClick={async () => {
                          await logout();
                          setAccountMenuOpen(false);
                          router.push("/");
                          router.refresh();
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-[var(--text-muted)] hover:bg-[var(--surface-muted)] border-t border-[var(--border-subtle)] mt-1"
                      >
                        Log out
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <Link href="/login" className="hidden sm:block leading-tight hover:underline">
                <span className="text-[11px] text-white/70">Hello, sign in</span>
                <span className="block font-medium">Account</span>
              </Link>
            )}

            <Link href="/account/orders" className="hidden sm:block leading-tight hover:underline">
              <span className="text-[11px] text-white/70">Returns</span>
              <span className="block font-medium">& Orders</span>
            </Link>

            <Link href="/cart" className="relative flex items-center gap-1 px-1 py-1.5 hover:bg-[var(--brand-navy-light)] rounded">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-7 h-7">
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.44a2 2 0 0 0 2 1.56h9.78a2 2 0 0 0 2-1.56l1.65-7.44H5.12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {totalCount > 0 && (
                <span className="absolute -top-1 left-4 bg-[var(--brand-buy)] text-white text-[11px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                  {totalCount > 99 ? "99+" : totalCount}
                </span>
              )}
              <span className="hidden lg:inline font-medium">Cart</span>
            </Link>
          </nav>
        </div>

        <div className="sm:hidden container-page pb-2.5">
          <SearchBar />
        </div>
      </div>

      {/* Secondary nav */}
      <div className="bg-[var(--brand-navy-light)] text-white text-sm hidden md:block">
        <div className="container-page flex items-center gap-5 py-2 overflow-x-auto">
          <Link href="/products" className="hover:underline whitespace-nowrap">All Products</Link>
          <Link href="/products?sort=newest" className="hover:underline whitespace-nowrap">New Arrivals</Link>
          <Link href="/products?bestSeller=true" className="hover:underline whitespace-nowrap">Best Sellers</Link>
          <Link href="/deals" className="hover:underline whitespace-nowrap font-semibold text-[var(--brand-buy)]">Today&apos;s Deals</Link>
          {categories.slice(0, 6).map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="hover:underline whitespace-nowrap">
              {c.name}
            </Link>
          ))}
          {user?.role === "ADMIN" && (
            <Link href="/admin" className="hover:underline whitespace-nowrap font-semibold ml-auto">
              Admin Dashboard
            </Link>
          )}
        </div>
      </div>

      {categoryMenuOpen && (
        <>
          <div className="hidden md:block fixed inset-0 z-30" onClick={() => setCategoryMenuOpen(false)} aria-hidden="true" />
          <div className="hidden md:block absolute left-0 top-full bg-white shadow-lg border border-[var(--border-subtle)] rounded-b-md w-64 py-2 z-40">
            {categories.length > 0 ? (
              categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={() => setCategoryMenuOpen(false)}
                  className="block px-4 py-2 text-sm text-[var(--text)] hover:bg-[var(--surface-muted)]"
                >
                  {c.name}
                </Link>
              ))
            ) : (
              <p className="px-4 py-2 text-sm text-[var(--text-faint)]">No categories yet.</p>
            )}
          </div>
        </>
      )}

      {mobileMenuOpen && (
        <>
          <div className="md:hidden fixed inset-0 z-30 bg-black/30" onClick={() => setMobileMenuOpen(false)} aria-hidden="true" />
          <div className="md:hidden relative z-40 bg-white border-b border-[var(--border-subtle)] shadow-lg">
            <nav className="flex flex-col text-sm py-2">
              <Link href="/products" onClick={() => setMobileMenuOpen(false)} className={navLinkClass("/products")}>All Products</Link>
              <Link
                href="/deals"
                onClick={() => setMobileMenuOpen(false)}
                className={`px-4 py-2.5 hover:bg-[var(--surface-muted)] text-[var(--brand-buy)] font-semibold ${pathname === "/deals" ? "bg-[var(--surface-muted)]" : ""}`}
              >
                Today&apos;s Deals
              </Link>
              {categories.map((c) => (
                <Link key={c.id} href={`/category/${c.slug}`} onClick={() => setMobileMenuOpen(false)} className={navLinkClass(`/category/${c.slug}`)}>
                  {c.name}
                </Link>
              ))}
              <div className="border-t border-[var(--border-subtle)] mt-1 pt-1">
                {!loading && user ? (
                  <>
                    <Link href="/account" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass("/account")}`}>My Account</Link>
                    <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass("/account/orders")}`}>My Orders</Link>
                    {user.role === "ADMIN" && (
                      <Link href="/admin" onClick={() => setMobileMenuOpen(false)} className={`block font-semibold ${navLinkClass("/admin")}`}>Admin Dashboard</Link>
                    )}
                    <button
                      onClick={async () => {
                        await logout();
                        setMobileMenuOpen(false);
                        router.push("/");
                        router.refresh();
                      }}
                      className="px-4 py-2.5 block w-full text-left hover:bg-[var(--surface-muted)] text-[var(--text-muted)]"
                    >
                      Log out
                    </button>
                  </>
                ) : (
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)} className={`block ${navLinkClass("/login")}`}>Log in</Link>
                )}
              </div>
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
