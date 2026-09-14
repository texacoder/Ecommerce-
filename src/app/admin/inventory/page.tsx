"use client";

import { Fragment, useEffect, useState } from "react";

type VariantRow = { variantId: string; name: string; sku: string; stock: number; lowStock: boolean; outOfStock: boolean };
type Row = {
  productId: string;
  name: string;
  sku: string;
  category: string | null;
  stock: number;
  lowStock: boolean;
  outOfStock: boolean;
  variants: VariantRow[];
};

export default function InventoryPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("");

  async function load() {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (filter) params.set("filter", filter);
    const res = await fetch(`/api/admin/inventory?${params.toString()}`);
    const data = await res.json();
    setRows(data.rows ?? []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  async function updateStock(productId: string | null, variantId: string | null, stock: number) {
    await fetch("/api/admin/inventory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, variantId, stock }),
    });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Inventory</h1>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          placeholder="Search by name or SKU"
          value={q}
          onKeyDown={(e) => e.key === "Enter" && load()}
          onChange={(e) => setQ(e.target.value)}
          className="border border-[var(--border-subtle)] rounded px-3 py-1.5 text-sm bg-transparent w-full sm:w-64"
        />
        <button onClick={load} className="text-sm underline">
          Search
        </button>
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border border-[var(--border-subtle)] rounded px-2 py-1.5 text-sm bg-transparent sm:ml-auto">
          <option value="">All</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="border border-[var(--border-subtle)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--surface-muted)]">
              <th className="p-3">Product</th>
              <th className="p-3">SKU</th>
              <th className="p-3">Category</th>
              <th className="p-3">Stock</th>
              <th className="p-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <Fragment key={r.productId}>
                <tr className="border-t border-[var(--border-subtle)]">
                  <td className="p-3 font-medium">{r.name}</td>
                  <td className="p-3">{r.sku}</td>
                  <td className="p-3 text-[var(--text-muted)]">{r.category ?? "—"}</td>
                  <td className="p-3">
                    <StockInput value={r.stock} onSave={(v) => updateStock(r.productId, null, v)} />
                  </td>
                  <td className="p-3">
                    <StockBadge lowStock={r.lowStock} outOfStock={r.outOfStock} />
                  </td>
                </tr>
                {r.variants.map((v) => (
                  <tr key={v.variantId} className="border-t border-[var(--border-subtle)] bg-[var(--surface-muted)]">
                    <td className="p-3 pl-8 text-[var(--text-muted)]">↳ {v.name}</td>
                    <td className="p-3">{v.sku}</td>
                    <td className="p-3"></td>
                    <td className="p-3">
                      <StockInput value={v.stock} onSave={(val) => updateStock(null, v.variantId, val)} />
                    </td>
                    <td className="p-3">
                      <StockBadge lowStock={v.lowStock} outOfStock={v.outOfStock} />
                    </td>
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="p-6 text-center text-[var(--text-muted)]">No matching products.</p>}
      </div>
    </div>
  );
}

function StockInput({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [val, setVal] = useState(value);
  return (
    <div className="flex gap-1 items-center">
      <input
        type="number"
        min={0}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-20 border border-[var(--border-subtle)] rounded px-2 py-1 bg-transparent"
      />
      {val !== value && (
        <button onClick={() => onSave(val)} className="text-xs underline">
          Save
        </button>
      )}
    </div>
  );
}

function StockBadge({ lowStock, outOfStock }: { lowStock: boolean; outOfStock: boolean }) {
  if (outOfStock) return <span className="text-xs font-semibold text-[var(--danger)]">Out of stock</span>;
  if (lowStock) return <span className="text-xs font-semibold text-[var(--warning)]">Low stock</span>;
  return <span className="text-xs text-[var(--success)]">In stock</span>;
}
