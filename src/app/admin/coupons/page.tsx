"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDate, formatMoney } from "@/lib/format";

const inputClass = "border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent w-full";
const labelClass = "block text-sm font-medium mb-1";
const helpClass = "text-xs text-[var(--text-muted)] mt-1";

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

type Scope = "store" | "product" | "category";

const empty = {
  code: "",
  type: "PERCENT" as "PERCENT" | "FIXED",
  value: "10",
  minOrderValue: "",
  expiresAt: "",
  usageLimit: "",
  perCustomerLimit: "",
  scope: "store" as Scope,
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
        // The <input type="date"> value is just "YYYY-MM-DD" - handing that
        // straight to `new Date()` parses it as UTC midnight, which is
        // already hours in the past for an IST admin by the time they pick
        // "today" expecting the coupon to last through the end of it.
        // Appending a local time (no "Z") makes the browser interpret it in
        // the admin's own timezone, matching what "expires on this date"
        // actually means to a human.
        expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        perCustomerLimit: form.perCustomerLimit ? Number(form.perCustomerLimit) : null,
        productId: form.scope === "product" ? form.productId || null : null,
        categoryId: form.scope === "category" ? form.categoryId || null : null,
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

  // A one-line, plain-English readout of exactly what this coupon will do,
  // built from the form's current state - so the effect of every field is
  // visible before hitting Create, instead of having to infer it from a
  // grid of unlabeled inputs.
  const summary = useMemo(() => {
    const value = Number(form.value) || 0;
    const discountText = form.type === "PERCENT" ? `${value}% off` : `₹${value} off`;
    const scopeText =
      form.scope === "product"
        ? products.find((p) => p.id === form.productId)?.name
          ? `on "${products.find((p) => p.id === form.productId)!.name}"`
          : "on one product (pick which below)"
        : form.scope === "category"
        ? categories.find((c) => c.id === form.categoryId)?.name
          ? `on the "${categories.find((c) => c.id === form.categoryId)!.name}" category (and its subcategories)`
          : "on one category (pick which below)"
        : "storewide, on any product";
    const minOrderText = form.minOrderValue ? `, on orders of ₹${form.minOrderValue}+` : "";
    const usageText = form.usageLimit ? `, up to ${form.usageLimit} uses total` : "";
    const perCustomerText = form.perCustomerLimit
      ? `, ${form.perCustomerLimit === "1" ? "once" : `up to ${form.perCustomerLimit} times`} per customer`
      : "";
    const expiryText = form.expiresAt ? `, expires ${formatDate(new Date(`${form.expiresAt}T00:00:00`).toISOString())}` : "";
    return `${discountText} ${scopeText}${minOrderText}${usageText}${perCustomerText}${expiryText}.`;
  }, [form, products, categories]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Coupons</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-md btn-primary px-4 py-2 text-sm font-medium">
          {showForm ? "Cancel" : "+ New coupon"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={createCoupon} className="border border-[var(--border-subtle)] rounded-lg p-5 mb-6 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Coupon code</label>
              <input
                required
                placeholder="e.g. WELCOME10"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                className={inputClass}
              />
              <p className={helpClass}>What the customer types at checkout.</p>
            </div>
            <div>
              <label className={labelClass}>Discount type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as "PERCENT" | "FIXED" })} className={inputClass}>
                <option value="PERCENT">Percentage off</option>
                <option value="FIXED">Fixed amount off (₹)</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{form.type === "PERCENT" ? "Discount %" : "Discount amount (₹)"}</label>
              <input
                required
                type="number"
                step={form.type === "PERCENT" ? "1" : "0.01"}
                placeholder={form.type === "PERCENT" ? "e.g. 10" : "e.g. 100"}
                value={form.value}
                onChange={(e) => setForm({ ...form, value: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-5">
            <label className={labelClass}>Applies to</label>
            <div className="flex flex-col gap-2 mb-3">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  checked={form.scope === "store"}
                  onChange={() => setForm({ ...form, scope: "store" })}
                />
                Entire store &mdash; any product qualifies
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  checked={form.scope === "product"}
                  onChange={() => setForm({ ...form, scope: "product" })}
                />
                Just one product
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="scope"
                  checked={form.scope === "category"}
                  onChange={() => setForm({ ...form, scope: "category" })}
                />
                Just one category &mdash; includes everything in its subcategories too
              </label>
            </div>
            {form.scope === "product" && (
              <select required value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} className={inputClass}>
                <option value="" disabled>
                  Choose a product&hellip;
                </option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            )}
            {form.scope === "category" && (
              <select required value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
                <option value="" disabled>
                  Choose a category&hellip;
                </option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent ? `${c.parent.name} → ${c.name}` : c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="border-t border-[var(--border-subtle)] pt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Minimum order value (₹)</label>
              <input
                type="number"
                step="0.01"
                placeholder="No minimum"
                value={form.minOrderValue}
                onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })}
                className={inputClass}
              />
              <p className={helpClass}>Cart total must be at least this much for the code to work.</p>
            </div>
            <div>
              <label className={labelClass}>Expiry date</label>
              <input type="date" value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} className={inputClass} />
              <p className={helpClass}>Leave blank for a coupon that never expires.</p>
            </div>
            <div>
              <label className={labelClass}>Total uses allowed</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={form.usageLimit}
                onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                className={inputClass}
              />
              <p className={helpClass}>How many times this code can be used in total, across all customers.</p>
            </div>
            <div>
              <label className={labelClass}>Uses per customer</label>
              <input
                type="number"
                placeholder="Unlimited"
                value={form.perCustomerLimit}
                onChange={(e) => setForm({ ...form, perCustomerLimit: e.target.value })}
                className={inputClass}
              />
              <p className={helpClass}>How many times the same customer can use it. Set to 1 for &ldquo;first order only&rdquo; style codes.</p>
            </div>
          </div>

          <div className="bg-[var(--surface-muted)] rounded-md p-3 text-sm">
            <span className="font-medium">This coupon will give: </span>
            {summary}
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
          <button className="rounded-md btn-primary py-2 text-sm font-medium">Create coupon</button>
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
                <td className="p-3">
                  {c.product?.name ?? (c.category?.name ? `${c.category.name} (+ subcategories)` : "Entire store")}
                </td>
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
