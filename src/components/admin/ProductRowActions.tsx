"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function ProductRowActions({ productId, status }: { productId: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggleStatus() {
    setBusy(true);
    const nextStatus = status === "PUBLISHED" ? "UNPUBLISHED" : "PUBLISHED";
    await fetch(`/api/admin/products/${productId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });
    setBusy(false);
    router.refresh();
  }

  async function deleteProduct() {
    if (!confirm("Delete this product? It will be unpublished and hidden, but historical orders will keep referencing it.")) return;
    setBusy(true);
    await fetch(`/api/admin/products/${productId}?confirm=true`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="flex gap-2 text-xs whitespace-nowrap">
      <button disabled={busy} onClick={toggleStatus} className="underline">
        {status === "PUBLISHED" ? "Unpublish" : "Publish"}
      </button>
      <button disabled={busy} onClick={deleteProduct} className="underline text-rose-600">
        Delete
      </button>
    </div>
  );
}
