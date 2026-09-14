"use client";

import { useEffect, useState } from "react";

const inputClass = "border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent";

type Category = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageUrl: string | null;
  visible: boolean;
  parentId: string | null;
  parent: { name: string } | null;
  _count: { products: number; children: number };
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState({ name: "", parentId: "" });
  const [message, setMessage] = useState<string | null>(null);

  async function load() {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function createCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    const res = await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat.name, parentId: newCat.parentId || null }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to create category");
      return;
    }
    setNewCat({ name: "", parentId: "" });
    load();
  }

  async function uploadImage(id: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    const uploadRes = await fetch("/api/admin/uploads", { method: "POST", body: form });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok) {
      setMessage(uploadData.error ?? "Upload failed");
      return;
    }
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageUrl: uploadData.url }),
    });
    load();
  }

  async function rename(id: string, name: string) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    load();
  }

  async function toggleVisible(id: string, visible: boolean) {
    await fetch(`/api/admin/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visible: !visible }),
    });
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this category? Products in it will be unassigned, not deleted.")) return;
    const res = await fetch(`/api/admin/categories/${id}?confirm=true`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      setMessage(data.error ?? "Failed to delete category");
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-6">Categories</h1>

      <form onSubmit={createCategory} className="flex gap-2 mb-6 items-end">
        <div>
          <label className="text-sm font-medium block mb-1">New category name</label>
          <input value={newCat.name} onChange={(e) => setNewCat({ ...newCat, name: e.target.value })} className={inputClass} />
        </div>
        <div>
          <label className="text-sm font-medium block mb-1">Parent (optional, for subcategories)</label>
          <select value={newCat.parentId} onChange={(e) => setNewCat({ ...newCat, parentId: e.target.value })} className={inputClass}>
            <option value="">None (top-level)</option>
            {categories.filter((c) => !c.parentId).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <button className="rounded-md btn-primary px-4 py-2 text-sm font-medium">Create</button>
      </form>

      {message && <p className="text-sm text-[var(--danger)] mb-4">{message}</p>}

      <div className="border border-[var(--border-subtle)] rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left bg-[var(--surface-muted)]">
              <th className="p-3">Image</th>
              <th className="p-3">Name</th>
              <th className="p-3">Parent</th>
              <th className="p-3">Products</th>
              <th className="p-3">Visible</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id} className="border-t border-[var(--border-subtle)]">
                <td className="p-3">
                  <label className="cursor-pointer">
                    {c.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.imageUrl} alt="" className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <span className="w-10 h-10 rounded bg-[var(--surface-muted)] inline-block" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) uploadImage(c.id, file);
                      }}
                    />
                  </label>
                </td>
                <td className="p-3">
                  <input
                    defaultValue={c.name}
                    onBlur={(e) => {
                      if (e.target.value !== c.name) rename(c.id, e.target.value);
                    }}
                    className="bg-transparent border-b border-transparent hover:border-black/20 dark:hover:border-white/20 focus:border-black/40"
                  />
                </td>
                <td className="p-3 text-[var(--text-muted)]">{c.parent?.name ?? "—"}</td>
                <td className="p-3">{c._count.products}</td>
                <td className="p-3">
                  <button onClick={() => toggleVisible(c.id, c.visible)} className={c.visible ? "text-[var(--success)]" : "text-[var(--text-faint)]"}>
                    {c.visible ? "Visible" : "Hidden"}
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
      </div>
    </div>
  );
}
