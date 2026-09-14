"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestions = {
  products: { id: string; name: string; slug: string; image: string | null }[];
  categories: { id: string; name: string; slug: string }[];
  brands: string[];
};

export default function SearchBar() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestions | null>(null);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (q.trim().length < 2) {
      setSuggestions(null);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/search/suggestions?q=${encodeURIComponent(q.trim())}`)
        .then((r) => r.json())
        .then((d) => setSuggestions(d.suggestions ?? null));
    }, 200);
    return () => clearTimeout(handle);
  }, [q]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function goToResults() {
    setOpen(false);
    router.push(q.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/products");
  }

  const hasSuggestions =
    suggestions && (suggestions.products.length > 0 || suggestions.categories.length > 0 || suggestions.brands.length > 0);

  return (
    <div ref={containerRef} className="relative flex-1 max-w-2xl">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          goToResults();
        }}
        className="flex rounded-md overflow-hidden ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[var(--brand-accent)]"
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder="Search products, brands and categories"
          className="flex-1 px-4 py-2.5 text-sm text-[var(--text)] bg-white outline-none min-w-0"
        />
        <button
          type="submit"
          aria-label="Search"
          className="bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-dark)] px-4 flex items-center justify-center text-white transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
        </button>
      </form>

      {open && hasSuggestions && (
        <div className="absolute left-0 right-0 mt-1 card-surface shadow-lg z-50 max-h-96 overflow-y-auto text-sm">
          {suggestions!.categories.length > 0 && (
            <div className="p-2 border-b border-[var(--border-subtle)]">
              <p className="text-xs font-semibold text-[var(--text-faint)] px-2 pb-1">Categories</p>
              {suggestions!.categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${c.slug}`}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 rounded hover:bg-[var(--surface-muted)]"
                >
                  {c.name}
                </Link>
              ))}
            </div>
          )}
          {suggestions!.products.length > 0 && (
            <div className="p-2 border-b border-[var(--border-subtle)]">
              <p className="text-xs font-semibold text-[var(--text-faint)] px-2 pb-1">Products</p>
              {suggestions!.products.map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-[var(--surface-muted)]"
                >
                  {p.image && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="w-8 h-8 rounded object-cover bg-[var(--surface-muted)]" />
                  )}
                  <span>{p.name}</span>
                </Link>
              ))}
            </div>
          )}
          {suggestions!.brands.length > 0 && (
            <div className="p-2">
              <p className="text-xs font-semibold text-[var(--text-faint)] px-2 pb-1">Brands</p>
              {suggestions!.brands.map((b) => (
                <Link
                  key={b}
                  href={`/search?q=${encodeURIComponent(b)}`}
                  onClick={() => setOpen(false)}
                  className="block px-2 py-1.5 rounded hover:bg-[var(--surface-muted)]"
                >
                  {b}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
