"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

type Address = {
  id: string;
  fullName: string;
  line1: string;
  line2: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
  isDefault: boolean;
};

const empty = { fullName: "", line1: "", line2: "", city: "", state: "", postalCode: "", country: "USA", phone: "", isDefault: false };

export default function AddressesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login?next=/account/addresses");
  }, [loading, user, router]);

  useEffect(() => {
    if (!user) return;
    fetch("/api/account/addresses")
      .then((r) => r.json())
      .then((d) => setAddresses(d.addresses ?? []));
  }, [user]);

  async function addAddress(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/account/addresses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Failed to save address");
      return;
    }
    setAddresses((prev) => [data.address, ...prev.map((a) => (form.isDefault ? { ...a, isDefault: false } : a))]);
    setForm(empty);
    setShowForm(false);
  }

  async function deleteAddress(id: string) {
    if (!confirm("Delete this address?")) return;
    const res = await fetch(`/api/account/addresses/${id}`, { method: "DELETE" });
    if (res.ok) setAddresses((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-xl font-semibold">Saved addresses</h1>
        <button onClick={() => setShowForm((v) => !v)} className="text-sm underline">
          {showForm ? "Cancel" : "Add address"}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addAddress} className="border border-black/10 dark:border-white/10 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3">
          <input required placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input required placeholder="Address line 1" value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input placeholder="Address line 2" value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input required placeholder="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input required placeholder="State" value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input required placeholder="Postal code" value={form.postalCode} onChange={(e) => setForm({ ...form, postalCode: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input required placeholder="Country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <input required placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="col-span-2 border border-black/15 dark:border-white/20 rounded px-3 py-2 text-sm bg-transparent" />
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm({ ...form, isDefault: e.target.checked })} />
            Set as default
          </label>
          {error && <p className="col-span-2 text-sm text-rose-600">{error}</p>}
          <button className="col-span-2 rounded-md bg-black text-white dark:bg-white dark:text-black py-2 text-sm font-medium">Save address</button>
        </form>
      )}

      <div className="flex flex-col gap-3">
        {addresses.map((a) => (
          <div key={a.id} className="border border-black/10 dark:border-white/10 rounded-lg p-4 flex justify-between items-start">
            <div className="text-sm">
              {a.isDefault && <span className="text-xs font-semibold text-emerald-600 block mb-1">Default</span>}
              {a.fullName}, {a.line1}
              {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} {a.postalCode}, {a.country} — {a.phone}
            </div>
            <button onClick={() => deleteAddress(a.id)} className="text-sm text-rose-600 hover:underline shrink-0 ml-4">
              Delete
            </button>
          </div>
        ))}
        {addresses.length === 0 && !showForm && <p className="text-black/60 dark:text-white/60 text-sm">No saved addresses yet.</p>}
      </div>
    </div>
  );
}
