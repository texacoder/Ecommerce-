"use client";

import { useEffect, useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";

const inputClass = "border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent w-full";

type Coupon = {
  id: string;
  code: string;
  type: "PERCENT" | "FIXED";
  value: number;
  minOrderValue: number | null;
  expiresAt: string | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  usedCount: number;
  active: boolean;
  product: { name: string } | null;
  category: { name: string } | null;
};

type Category = { id: string; name: string; parent?: { name: string } | null };
type Product = { id: string; name: string };

const empty = {
  code: "",
  type: "PERCENT" as "PERCENT" | "FIXED",
  value: "10",
  minOrderValue: "",
  expiresAt: "",
  usageLimit: "",
  perCustomerLimit: "",
  productId: "",
  categoryId: "",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/coupons");
    const data = await res.json();
    setCoupons(data.coupons ?? []);
  }

  useEffect(() => {
    load();
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
    fetch("/api/admin/products?pageSize=100")
      .then((r) => r.json())
      .then((d) => setProducts((d.products ?? []).map((p: { id: string; name: string }) => ({ id: p.id, name: p.name }))));
  }, []);

  async function createCoupon(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/coupons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: form.type === "PERCENT" ? Number(form.value) : Math.round(Number(form.value) * 100),
        minOrderValue: form.minOrderValue ? Math.round(Number(form.minOrderValue) * 100) : null,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : null,
        productId: form.productId || null,
        categoryId: form.categoryId || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create coupon");
      return;
    }
    setForm(empty);
    setShowForm(false);
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this coupon?")) return;
    await fetch(`/api/admin/coupons/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-md btn-primary px-4 py-2 text-sm font-medium">
          {showForm ? "Cancel" : "+ New coupon"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCoupon} className="border border-[var(--border-subtle)] rounded-lg p-4 mb-6 grid grid-cols-3 gap-3">
          <input required placeholder="CODE" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} className={inputClass} />
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })} className={inputClass}>
            <option value="PERCENT">Percentage off</option>
            <option value="FIXED">Fixed amount off</option>
          </select>
          <input required type="number" step={form.type === "PERCENT" ? "1" : "0.01"} placeholder={form.type === "PERCENT" ? "Value (%)" : "Value (₹)"} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} className={inputClass} />
          <input type="number" step="0.01" placeholder="Minimum order value (₹)" value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} className={inputClass} />
          <input type="date" placeholder="Expiry date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
          <input type="number" placeholder="Total usage limit" value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} className={inputClass} />
          <input type="number" placeholder="Per-customer limit" value={form.perCustomerLimit} onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })} className={inputClass} />

          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value, categoryId: e.target.value ? "" : form.categoryId })}
            className={inputClass}
          >
            <option value="">Apply to: all products</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                Only: {p.name}
              </option>
            ))}
          </select>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, productId: e.target.value ? "" : form.productId })}
            className={inputClass}
          >
            <option value="">Apply to: all categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                Only category: {c.parent ? `${c.parent.name} — ${c.name}` : c.name}
              </option>
            ))}
          </select>

          {error && <p className="col-span-3 text-sm text-[var(--danger)]">{error}</p>}
          <button className="col-span-3 rounded-md btn-primary py-2 text-sm font-medium">Create coupon</button>
        </form>
      )}

      <div className="border border-[var(--border-subtle)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--surface-muted)]">
              <th className="p-3">Code</th>
              <th className="p-3">Discount</th>
              <th className="p-3">Min order</th>
              <th className="p-3">Scope</th>
              <th className="p-3">Uses</th>
              <th className="p-3">Expires</th>
              <th className="p-3">Active</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border-subtle)]">
                <td className="p-3 font-medium">{c.code}</td>
                <td className="p-3">{c.type === "PERCENT" ? `${c.value}%` : formatMoney(c.value)}</td>
                <td className="p-3">{c.minOrderValue ? formatMoney(c.minOrderValue) : "—"}</td>
                <td className="p-3">{c.product?.name ?? c.category?.name ?? "All products"}</td>
                <td className="p-3">
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}
                </td>
                <td className="p-3">{c.expiresAt ? formatDate(c.expiresAt) : "—"}</td>
                <td className="p-3">
                  <button onClick={() => toggleActive(c.id, c.active)} className={c.active ? "text-[var(--success)]" : "text-[var(--text-faint)]"}>
                    {c.active ? "Active" : "Inactive"}
                  </button>
                </td>
                <td className="p-3">
                  <button onClick={() => remove(c.id)} className="text-[var(--danger)] underline text-xs">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && <p className="p-6 text-center text-[var(--text-muted)]">No coupons yet.</p>}
      </div>
    </div>
  );
}
