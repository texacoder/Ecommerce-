"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Category = { id: string; name: string; parent?: { name: string } | null };

const inputClass = "border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent w-full";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [form, setForm] = useState({
    name: "",
    sku: "",
    brand: "",
    categoryId: "",
    price: "",
    originalPrice: "",
    shippingCost: "0",
    stock: "0",
    description: "",
    status: "DRAFT",
    isReturnable: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => r.json())
      .then((d) => setCategories(d.categories ?? []));
  }, []);

  function addImageByUrl() {
    if (!newImageUrl.trim()) return;
    setImages((prev) => [...prev, newImageUrl.trim()]);
    setNewImageUrl("");
  }

  async function uploadImage(file: File) {
    setUploading(true);
    setError(null);
    try {
      const uploadForm = new FormData();
      uploadForm.append("file", file);
      const res = await fetch("/api/admin/uploads", { method: "POST", body: uploadForm });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setImages((prev) => [...prev, data.url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function removeImage(url: string) {
    setImages((prev) => prev.filter((u) => u !== url));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          sku: form.sku,
          brand: form.brand || null,
          categoryId: form.categoryId || null,
          price: Math.round(Number(form.price) * 100),
          originalPrice: form.originalPrice ? Math.round(Number(form.originalPrice) * 100) : null,
          shippingCost: form.shippingCost ? Math.round(Number(form.shippingCost) * 100) : 0,
          stock: Number(form.stock),
          description: form.description || null,
          status: form.status,
          isReturnable: form.isReturnable,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create product");

      for (const url of images) {
        await fetch(`/api/admin/products/${data.product.id}/images`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
      }

      router.push(`/admin/products/${data.product.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-xl">
      <h1 className="text-xl font-semibold mb-6">New product</h1>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <Field label="Name">
          <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
        </Field>
        <Field label="SKU">
          <input required value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Brand">
          <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Category">
          <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className={inputClass}>
            <option value="">None</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.parent ? `${c.parent.name} — ${c.name}` : c.name}
              </option>
            ))}
          </select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Price (₹)">
            <input required type="number" step="0.01" min="0" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Original price (₹, optional)">
            <input type="number" step="0.01" min="0" value={form.originalPrice} onChange={(e) => setForm({ ...form, originalPrice: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Stock quantity">
            <input required type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={inputClass} />
          </Field>
          <Field label="Shipping cost (₹ per unit)">
            <input type="number" step="0.01" min="0" value={form.shippingCost} onChange={(e) => setForm({ ...form, shippingCost: e.target.value })} className={inputClass} />
          </Field>
        </div>
        <Field label="Description">
          <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} />
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
            <option value="UNPUBLISHED">Unpublished</option>
          </select>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isReturnable} onChange={(e) => setForm({ ...form, isReturnable: e.target.checked })} />
          This product can be returned
        </label>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Images (optional)</span>
          {images.length > 0 && (
            <div className="flex flex-wrap gap-3 mb-1">
              {images.map((url) => (
                <div key={url} className="relative w-24">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="w-24 h-24 object-cover rounded border border-[var(--border-subtle)]" />
                  <button
                    type="button"
                    onClick={() => removeImage(url)}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-[var(--border-subtle)] rounded-full w-5 h-5 text-xs text-[var(--danger)] leading-none"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex flex-wrap gap-2 items-center">
            <input
              placeholder="Image URL"
              value={newImageUrl}
              onChange={(e) => setNewImageUrl(e.target.value)}
              className={`${inputClass} w-full sm:max-w-xs`}
            />
            <button type="button" onClick={addImageByUrl} className="text-sm underline shrink-0">
              Add by URL
            </button>
            <label className="text-sm underline cursor-pointer shrink-0">
              {uploading ? "Uploading..." : "Upload file"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadImage(file);
                }}
              />
            </label>
          </div>
        </div>

        {error && <p className="text-sm text-[var(--danger)]">{error}</p>}
        <button disabled={submitting} className="rounded-md btn-primary py-2.5 font-medium disabled:opacity-50">
          {submitting ? "Creating..." : "Create product"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium">
      {label}
      {children}
    </label>
  );
}
