export type ActiveFilters = {
  q?: string;
  category?: string;
  sort?: string;
  priceMin?: string;
  priceMax?: string;
  brand?: string;
  minRating?: string;
  inStockOnly?: string;
  minDiscount?: string;
};

/** Server-rendered GET filter form — works without JavaScript, matching the
 * rest of the listing pages' progressive-enhancement approach. */
export default function ProductFilters({
  action,
  filters,
  brands,
  categories,
}: {
  action: string;
  filters: ActiveFilters;
  brands: string[];
  categories?: { name: string; slug: string }[];
}) {
  const fields = (
    <>
      {filters.q && <input type="hidden" name="q" value={filters.q} />}

      <div>
        <h3 className="font-semibold mb-2">Sort by</h3>
        <select name="sort" defaultValue={filters.sort ?? "relevance"} className="input-field">
          <option value="relevance">Relevance</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="rating">Avg. Customer Rating</option>
          <option value="newest">Newest Arrivals</option>
          <option value="popularity">Popularity</option>
        </select>
      </div>

      {categories && categories.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Category</h3>
          <select name="category" defaultValue={filters.category ?? ""} className="input-field">
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Price range (₹)</h3>
        <div className="flex gap-2">
          <input
            type="number"
            name="priceMin"
            placeholder="Min"
            min={0}
            defaultValue={filters.priceMin}
            className="input-field"
          />
          <input
            type="number"
            name="priceMax"
            placeholder="Max"
            min={0}
            defaultValue={filters.priceMax}
            className="input-field"
          />
        </div>
      </div>

      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold mb-2">Brand</h3>
          <select name="brand" defaultValue={filters.brand ?? ""} className="input-field">
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <h3 className="font-semibold mb-2">Minimum rating</h3>
        <select name="minRating" defaultValue={filters.minRating ?? ""} className="input-field">
          <option value="">Any rating</option>
          <option value="4">4★ &amp; up</option>
          <option value="3">3★ &amp; up</option>
          <option value="2">2★ &amp; up</option>
        </select>
      </div>

      <div>
        <h3 className="font-semibold mb-2">Discount</h3>
        <select name="minDiscount" defaultValue={filters.minDiscount ?? ""} className="input-field">
          <option value="">Any discount</option>
          <option value="10">10% off or more</option>
          <option value="25">25% off or more</option>
          <option value="50">50% off or more</option>
        </select>
      </div>

      <label className="flex items-center gap-2">
        <input type="checkbox" name="inStockOnly" value="true" defaultChecked={filters.inStockOnly === "true"} />
        In stock only
      </label>

      <button type="submit" className="btn-primary py-2">Apply Filters</button>
      <a href={action} className="text-center text-[var(--text-muted)] hover:underline text-xs">
        Clear all filters
      </a>
    </>
  );

  return (
    <>
      {/* Mobile: collapsed behind a native, JS-free <details> toggle so it
          doesn't push the product grid below the fold on a phone screen. */}
      <details className="md:hidden card-surface text-sm">
        <summary className="font-semibold p-4 cursor-pointer list-none flex items-center justify-between">
          <span className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
              <path d="M4 6h16M7 12h10M10 18h4" strokeLinecap="round" />
            </svg>
            Filters
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
            <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </summary>
        <form method="get" action={action} className="flex flex-col gap-5 p-4 pt-0">
          {fields}
        </form>
      </details>

      {/* Desktop: always visible in the sidebar. */}
      <form method="get" action={action} className="hidden md:flex card-surface p-4 flex-col gap-5 text-sm">
        {fields}
      </form>
    </>
  );
}
