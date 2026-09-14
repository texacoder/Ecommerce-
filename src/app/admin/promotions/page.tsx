"use client";

import { useEffect, useState } from "react";

const inputClass = "border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent w-full";

type Promotion = {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  position: number;
  active: boolean;
  startsAt: string | null;
  endsAt: string | null;
  product: { name: string } | null;
  category: { name: string } | null;
};

type Category = { id: string; name: string; parent?: { name: string } | null };
type Product = { id: string; name: string };

const empty = { type: "BANNER", title: "", subtitle: "", linkUrl: "", position: "0", productId: "", categoryId: "" };

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState(empty);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/promotions");
    const data = await res.json();
    setPromotions(data.promotions ?? []);
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

  async function uploadImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: formData });
    const data = await res.json();
    if (res.ok) setImageUrl(data.url);
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/admin/promotions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.type,
        title: form.title,
        subtitle: form.subtitle || null,
        linkUrl: form.linkUrl || null,
        imageUrl,
        position: Number(form.position) || 0,
        productId: form.productId || null,
        categoryId: form.categoryId || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to create promotion");
      return;
    }
    setForm(empty);
    setImageUrl(null);
    setShowForm(false);
    load();
  }

  async function toggleActive(id: string, active: boolean) {
    await fetch(`/api/admin/promotions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this promotion?")) return;
    await fetch(`/api/admin/promotions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Promotions</h1>
        <button onClick={() => setShowForm((v) => !v)} className="rounded-md btn-primary px-4 py-2 text-sm font-medium">
          {showForm ? "Cancel" : "+ New promotion"}
        </button>
      </div>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        Banners appear on the homepage carousel. Featured products, best sellers, and new arrivals are controlled per-product from the Products page.
      </p>

      {showForm && (
        <form onSubmit={create} className="border border-[var(--border-subtle)] rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
          <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputClass}>
            <option value="BANNER">Homepage banner</option>
            <option value="DEAL">Deal</option>
            <option value="SALE_CAMPAIGN">Sale campaign</option>
            <option value="FEATURED_SECTION">Featured section</option>
          </select>
          <input placeholder="Position (order, 0 first)" type="number" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputClass} />
          <input required placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={`${inputClass} col-span-2`} />
          <input placeholder="Subtitle" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={`${inputClass} col-span-2`} />
          <input placeholder="Link URL (e.g. /products/some-slug)" value={form.linkUrl} onChange={(e) => setForm({ ...form, linkUrl: e.target.value })} className={`${inputClass} col-span-2`} />
          <select
            value={form.productId}
            onChange={(e) => setForm({ ...form, productId: e.target.value, categoryId: e.target.value ? "" : form.categoryId })}
            className={inputClass}
          >
            <option value="">No linked product</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                Product: {p.name}
              </option>
            ))}
          </select>
          <select
            value={form.categoryId}
            onChange={(e) => setForm({ ...form, categoryId: e.target.value, productId: e.target.value ? "" : form.productId })}
            className={inputClass}
          >
            <option value="">No linked category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                Category: {c.parent ? `${c.parent.name} — ${c.name}` : c.name}
              </option>
            ))}
          </select>
          <p className="col-span-2 text-xs text-[var(--text-faint)] -mt-1">
            A linked category powers a Featured Section&apos;s product grid (including its subcategories); a linked
            product is used for Deal tiles and single-product spotlights.
          </p>
          <label className="col-span-2 text-sm">
            Image:{" "}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
            {imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="" className="w-16 h-16 object-cover rounded mt-2" />
            )}
          </label>
          {error && <p className="col-span-2 text-sm text-[var(--danger)]">{error}</p>}
          <button className="col-span-2 rounded-md btn-primary py-2 text-sm font-medium">Create promotion</button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {promotions.map((p) => (
          <div key={p.id} className="border border-[var(--border-subtle)] rounded-lg p-4 flex justify-between items-center">
            <div>
              <p className="font-medium">
                {p.title} <span className="text-xs text-[var(--text-faint)]">({p.type})</span>
              </p>
              {p.subtitle && <p className="text-sm text-[var(--text-muted)]">{p.subtitle}</p>}
              {(p.product || p.category) && (
                <p className="text-xs text-[var(--text-faint)] mt-0.5">
                  Linked to: {p.product ? `product "${p.product.name}"` : `category "${p.category?.name}"`}
                </p>
              )}
            </div>
            <div className="flex gap-3 items-center">
              <button onClick={() => toggleActive(p.id, p.active)} className={`text-sm ${p.active ? "text-[var(--success)]" : "text-[var(--text-faint)]"}`}>
                {p.active ? "Active" : "Inactive"}
              </button>
              <button onClick={() => remove(p.id)} className="text-sm text-[var(--danger)] underline">
                Delete
              </button>
            </div>
          </div>
        ))}
        {promotions.length === 0 && <p className="text-sm text-[var(--text-muted)]">No promotions yet.</p>}
      </div>
    </div>
  );
}
