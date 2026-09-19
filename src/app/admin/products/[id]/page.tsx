"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/format";

const inputClass = "border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent w-full";

type Category = { id: string; name: string; parent?: { name: string } | null };
type ImageRow = { id: string; url: string; position: number };
type VariantRow = { id: string; name: string; sku: string; priceOverride: number | null; stock: number; attributes: string | null };
type OptionLinkRow = { id: string; optionProduct: { id: string; name: string; sku: string; price: number } };
type ProductSearchResult = { id: string; name: string; sku: string; price: number };
type SpecRow = { key: string; value: string };

// Specifications are stored as a JSON object string. Older data (or a value
// typed by hand before this editor existed) may not be valid JSON at all -
// salvage it into a single row instead of losing it, rather than crashing
// when the storefront tries to parse it.
function parseSpecRows(raw: string | null): SpecRow[] {
  if (!raw) return [];
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === "object" && !Array.isArray(obj)) {
      return Object.entries(obj).map(([key, value]) => ({ key, value: String(value) }));
    }
  } catch {
    // fall through to salvage below
  }
  return [{ key: "Note", value: raw }];
}
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  specifications: string | null;
  price: number;
  originalPrice: number | null;
  discountPercent: number | null;
  shippingCost: number;
  sku: string;
  brand: string | null;
  categoryId: string | null;
  stock: number;
  status: string;
  isFeatured: boolean;
  isBestSeller: boolean;
  isNewArrival: boolean;
  isReturnable: boolean;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  images: ImageRow[];
  variants: VariantRow[];
  optionLinks: OptionLinkRow[];
};

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newVariant, setNewVariant] = useState({ name: "", sku: "", priceOverride: "", stock: "0" });
  const [specRows, setSpecRows] = useState<SpecRow[]>([]);
  const [optionSearch, setOptionSearch] = useState("");
  const [optionResults, setOptionResults] = useState<ProductSearchResult[]>([]);
  const [searchingOptions, setSearchingOptions] = useState(false);

  const load = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch(`/api/admin/products/${id}`), fetch("/api/admin/categories")]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    setProduct(pData.product);
    setSpecRows(parseSpecRows(pData.product.specifications));
    setCategories(cData.categories ?? []);
  }, [id]);

  // Specifications editing works on key/value rows so nobody has to
  // hand-type JSON; this serializes them back into the JSON string the API
  // and storefront expect, dropping rows with no key.
  function applySpecRows(rows: SpecRow[]) {
    setSpecRows(rows);
    const obj: Record<string, string> = {};
    for (const row of rows) {
      const key = row.key.trim();
      if (key) obj[key] = row.value;
    }
    setProduct((p) => (p ? { ...p, specifications: Object.keys(obj).length ? JSON.stringify(obj) : null } : p));
  }

  useEffect(() => {
    load();
  }, [load]);

  if (!product) return <p className="text-sm text-[var(--text-muted)]">Loading...</p>;

  async function save(patch: Record<string, unknown>) {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      setProduct(data.product);
      setMessage("Saved");
      setTimeout(() => setMessage(null), 1500);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function saveAllFields(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    await save({
      name: product.name,
      description: product.description,
      specifications: product.specifications,
      price: product.price,
      originalPrice: product.originalPrice,
      discountPercent: product.discountPercent,
      shippingCost: product.shippingCost,
      sku: product.sku,
      brand: product.brand,
      categoryId: product.categoryId,
      stock: product.stock,
      status: product.status,
      isFeatured: product.isFeatured,
      isBestSeller: product.isBestSeller,
      isNewArrival: product.isNewArrival,
      isReturnable: product.isReturnable,
      visible: product.visible,
    });
  }

  async function deleteProduct() {
    if (!confirm("Delete this product? It will be soft-deleted (unpublished + hidden) to preserve historical orders.")) return;
    await fetch(`/api/admin/products/${id}?confirm=true`, { method: "DELETE" });
    router.push("/admin/products");
  }

  async function addImageByUrl() {
    if (!newImageUrl.trim()) return;
    const res = await fetch(`/api/admin/products/${id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: newImageUrl.trim() }),
    });
    if (res.ok) {
      setNewImageUrl("");
      load();
    }
  }

  async function uploadImage(file: File) {
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setMessage(uploadData.error ?? "Upload failed");
      return;
    }
    await fetch(`/api/admin/products/${id}/images`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploadData.url }),
    });
    load();
  }

  async function removeImage(imageId: string) {
    await fetch(`/api/admin/products/${id}/images/${imageId}`, { method: "DELETE" });
    load();
  }

  async function replaceImage(imageId: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setMessage(uploadData.error ?? "Upload failed");
      return;
    }
    await fetch(`/api/admin/products/${id}/images/${imageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: uploadData.url }),
    });
    load();
  }

  async function moveImage(imageId: string, direction: -1 | 1) {
    if (!product) return;
    const order = product.images.map((i) => i.id);
    const idx = order.indexOf(imageId);
    const swapWith = idx + direction;
    if (swapWith < 0 || swapWith >= order.length) return;
    [order[idx], order[swapWith]] = [order[swapWith], order[idx]];
    await fetch(`/api/admin/products/${id}/images`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order }),
    });
    load();
  }

  async function addVariant() {
    if (!newVariant.name.trim() || !newVariant.sku.trim()) return;
    const res = await fetch(`/api/admin/products/${id}/variants`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newVariant.name,
        sku: newVariant.sku,
        priceOverride: newVariant.priceOverride ? Math.round(Number(newVariant.priceOverride) * 100) : null,
        stock: Number(newVariant.stock) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to add variant");
      return;
    }
    setNewVariant({ name: "", sku: "", priceOverride: "", stock: "0" });
    load();
  }

  async function saveVariant(v: VariantRow) {
    await fetch(`/api/admin/products/${id}/variants/${v.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: v.name, sku: v.sku, priceOverride: v.priceOverride, stock: v.stock }),
    });
    load();
  }

  async function removeVariant(variantId: string) {
    if (!confirm("Remove this variant?")) return;
    await fetch(`/api/admin/products/${id}/variants/${variantId}`, { method: "DELETE" });
    load();
  }

  async function searchOptionProducts() {
    if (!optionSearch.trim()) {
      setOptionResults([]);
      return;
    }
    setSearchingOptions(true);
    try {
      const res = await fetch(`/api/admin/products?q=${encodeURIComponent(optionSearch.trim())}&pageSize=10`);
      const data = await res.json();
      const linkedIds = new Set(product?.optionLinks.map((l) => l.optionProduct.id) ?? []);
      setOptionResults(
        (data.products ?? [])
          .filter((p: { id: string }) => p.id !== id && !linkedIds.has(p.id))
          .map((p: { id: string; name: string; sku: string; price: number }) => ({ id: p.id, name: p.name, sku: p.sku, price: p.price }))
      );
    } finally {
      setSearchingOptions(false);
    }
  }

  async function addOptionLink(optionProductId: string) {
    await fetch(`/api/admin/products/${id}/options`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ optionProductId }),
    });
    setOptionSearch("");
    setOptionResults([]);
    load();
  }

  async function removeOptionLink(optionProductId: string) {
    await fetch(`/api/admin/products/${id}/options/${optionProductId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="max-w-3xl">
      <div className="flex justify-between items-center mb-1">
        <h1 className="text-xl font-semibold">{product.name}</h1>
        <button onClick={deleteProduct} className="text-sm text-[var(--danger)] underline">
          Delete product
        </button>
      </div>
      <p className="text-xs text-[var(--text-faint)] mb-6">
        Created {formatDateTime(product.createdAt)} · Updated {formatDateTime(product.updatedAt)}
      </p>

      <form onSubmit={saveAllFields} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Name">
            <input className={inputClass} value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} />
          </Field>
          <Field label="SKU">
            <input className={inputClass} value={product.sku} onChange={(e) => setProduct({ ...product, sku: e.target.value })} />
          </Field>
          <Field label="Brand">
            <input className={inputClass} value={product.brand ?? ""} onChange={(e) => setProduct({ ...product, brand: e.target.value || null })} />
          </Field>
          <Field label="Category">
            <select className={inputClass} value={product.categoryId ?? ""} onChange={(e) => setProduct({ ...product, categoryId: e.target.value || null })}>
              <option value="">None</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent ? `${c.parent.name} — ${c.name}` : c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Price (₹)">
            <input type="number" step="0.01" className={inputClass} value={(product.price / 100).toString()} onChange={(e) => setProduct({ ...product, price: Math.round(Number(e.target.value) * 100) })} />
          </Field>
          <Field label="Original price (₹)">
            <input type="number" step="0.01" className={inputClass} value={product.originalPrice ? (product.originalPrice / 100).toString() : ""} onChange={(e) => setProduct({ ...product, originalPrice: e.target.value ? Math.round(Number(e.target.value) * 100) : null })} />
          </Field>
          <Field label="Discount % (display only)">
            <input type="number" min={0} max={100} className={inputClass} value={product.discountPercent ?? ""} onChange={(e) => setProduct({ ...product, discountPercent: e.target.value ? Number(e.target.value) : null })} />
          </Field>
          <Field label="Stock quantity">
            <input type="number" min={0} className={inputClass} value={product.stock} onChange={(e) => setProduct({ ...product, stock: Number(e.target.value) })} />
          </Field>
          <Field label="Shipping cost (₹ per unit)">
            <input type="number" step="0.01" min={0} className={inputClass} value={(product.shippingCost / 100).toString()} onChange={(e) => setProduct({ ...product, shippingCost: Math.round(Number(e.target.value) * 100) })} />
          </Field>
          <Field label="Status">
            <select className={inputClass} value={product.status} onChange={(e) => setProduct({ ...product, status: e.target.value })}>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="UNPUBLISHED">Unpublished</option>
            </select>
          </Field>
        </div>

        <Field label="Description">
          <textarea rows={4} className={inputClass} value={product.description ?? ""} onChange={(e) => setProduct({ ...product, description: e.target.value })} />
        </Field>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Specifications</span>
          {specRows.map((row, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                placeholder="Name (e.g. Size)"
                value={row.key}
                onChange={(e) => applySpecRows(specRows.map((r, idx) => (idx === i ? { ...r, key: e.target.value } : r)))}
                className={`${inputClass} w-2/5`}
              />
              <input
                placeholder="Value (e.g. Free size)"
                value={row.value}
                onChange={(e) => applySpecRows(specRows.map((r, idx) => (idx === i ? { ...r, value: e.target.value } : r)))}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => applySpecRows(specRows.filter((_, idx) => idx !== i))}
                className="text-[var(--danger)] text-xs shrink-0"
              >
                Remove
              </button>
            </div>
          ))}
          <button type="button" onClick={() => applySpecRows([...specRows, { key: "", value: "" }])} className="text-sm underline w-fit">
            + Add specification
          </button>
        </div>

        <div className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={product.isFeatured} onChange={(e) => setProduct({ ...product, isFeatured: e.target.checked })} />
            Featured
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={product.isBestSeller} onChange={(e) => setProduct({ ...product, isBestSeller: e.target.checked })} />
            Best seller
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={product.isNewArrival} onChange={(e) => setProduct({ ...product, isNewArrival: e.target.checked })} />
            New arrival
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={product.visible} onChange={(e) => setProduct({ ...product, visible: e.target.checked })} />
            Visible
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={product.isReturnable} onChange={(e) => setProduct({ ...product, isReturnable: e.target.checked })} />
            Returnable
          </label>
        </div>

        {message && <p className="text-sm">{message}</p>}
        <button disabled={saving} className="rounded-md btn-primary py-2.5 font-medium disabled:opacity-50 w-fit px-6">
          {saving ? "Saving..." : "Save changes"}
        </button>
      </form>

      <section className="mt-10">
        <h2 className="font-semibold mb-3">Images</h2>
        <div className="flex flex-wrap gap-3 mb-3">
          {product.images.map((img, idx) => (
            <div key={img.id} className="relative w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-28 h-28 object-cover rounded border border-[var(--border-subtle)]" />
              <div className="flex justify-between mt-1 text-xs">
                <button disabled={idx === 0} onClick={() => moveImage(img.id, -1)} className="disabled:opacity-30">
                  ↑
                </button>
                <button disabled={idx === product.images.length - 1} onClick={() => moveImage(img.id, 1)} className="disabled:opacity-30">
                  ↓
                </button>
                <label className="underline cursor-pointer">
                  Replace
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) replaceImage(img.id, file);
                    }}
                  />
                </label>
                <button onClick={() => removeImage(img.id)} className="text-[var(--danger)]">
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input placeholder="Image URL" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} className={`${inputClass} w-full sm:max-w-xs`} />
          <button onClick={addImageByUrl} className="text-sm underline">
            Add by URL
          </button>
          <label className="text-sm underline cursor-pointer">
            Upload file
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) uploadImage(file);
              }}
            />
          </label>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold mb-3">Variants</h2>
        <div className="flex flex-col gap-2 mb-4">
          {product.variants.map((v) => (
            <div key={v.id} className="flex flex-wrap gap-2 items-center text-sm border border-[var(--border-subtle)] rounded p-2">
              <input
                className={`${inputClass} w-40`}
                value={v.name}
                onChange={(e) =>
                  setProduct({ ...product, variants: product.variants.map((x) => (x.id === v.id ? { ...x, name: e.target.value } : x)) })
                }
              />
              <input
                className={`${inputClass} w-32`}
                value={v.sku}
                onChange={(e) =>
                  setProduct({ ...product, variants: product.variants.map((x) => (x.id === v.id ? { ...x, sku: e.target.value } : x)) })
                }
              />
              <input
                type="number"
                step="0.01"
                placeholder="Price override"
                className={`${inputClass} w-32`}
                value={v.priceOverride !== null ? (v.priceOverride / 100).toString() : ""}
                onChange={(e) =>
                  setProduct({
                    ...product,
                    variants: product.variants.map((x) => (x.id === v.id ? { ...x, priceOverride: e.target.value ? Math.round(Number(e.target.value) * 100) : null } : x)),
                  })
                }
              />
              <input
                type="number"
                className={`${inputClass} w-20`}
                value={v.stock}
                onChange={(e) =>
                  setProduct({ ...product, variants: product.variants.map((x) => (x.id === v.id ? { ...x, stock: Number(e.target.value) } : x)) })
                }
              />
              <button onClick={() => saveVariant(v)} className="underline shrink-0">
                Save
              </button>
              <button onClick={() => removeVariant(v.id)} className="text-[var(--danger)] underline shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <input placeholder="Name (e.g. Color: Red)" value={newVariant.name} onChange={(e) => setNewVariant({ ...newVariant, name: e.target.value })} className={`${inputClass} w-40`} />
          <input placeholder="SKU" value={newVariant.sku} onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })} className={`${inputClass} w-32`} />
          <input placeholder="Price override" type="number" step="0.01" value={newVariant.priceOverride} onChange={(e) => setNewVariant({ ...newVariant, priceOverride: e.target.value })} className={`${inputClass} w-32`} />
          <input placeholder="Stock" type="number" value={newVariant.stock} onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })} className={`${inputClass} w-20`} />
          <button onClick={addVariant} className="underline shrink-0">
            + Add variant
          </button>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-semibold mb-1">Linked options</h2>
        <p className="text-xs text-[var(--text-faint)] mb-3">
          Other, separately-listed products a customer can switch to from this product's page (e.g. a different
          design of the same item). Unlike variants, each option keeps its own name, photo and price - selecting
          one takes the customer to that product's own page.
        </p>
        <div className="flex flex-col gap-2 mb-4">
          {product.optionLinks.length === 0 && <p className="text-sm text-[var(--text-faint)]">No linked options yet.</p>}
          {product.optionLinks.map((link) => (
            <div key={link.id} className="flex items-center justify-between text-sm border border-[var(--border-subtle)] rounded p-2">
              <span>
                {link.optionProduct.name} <span className="text-[var(--text-faint)]">({link.optionProduct.sku}) · ₹{(link.optionProduct.price / 100).toFixed(2)}</span>
              </span>
              <button onClick={() => removeOptionLink(link.optionProduct.id)} className="text-[var(--danger)] underline shrink-0">
                Remove
              </button>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2 items-center text-sm">
            <input
              placeholder="Search products by name or SKU"
              value={optionSearch}
              onChange={(e) => setOptionSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchOptionProducts())}
              className={`${inputClass} w-full sm:max-w-xs`}
            />
            <button type="button" onClick={searchOptionProducts} className="underline shrink-0">
              {searchingOptions ? "Searching..." : "Search"}
            </button>
          </div>
          {optionResults.length > 0 && (
            <div className="flex flex-col gap-2">
              {optionResults.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm border border-[var(--border-subtle)] rounded p-2">
                  <span>
                    {r.name} <span className="text-[var(--text-faint)]">({r.sku}) · ₹{(r.price / 100).toFixed(2)}</span>
                  </span>
                  <button type="button" onClick={() => addOptionLink(r.id)} className="underline shrink-0">
                    + Add as option
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
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
