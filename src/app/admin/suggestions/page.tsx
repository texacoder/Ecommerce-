"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

type Suggestion = { id: string; message: string; source: string; createdAt: string };

export default function AdminSuggestionsPage() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  async function load() {
    const res = await fetch("/api/admin/suggestions");
    const data = await res.json();
    setSuggestions(data.suggestions ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    if (!confirm("Delete this suggestion?")) return;
    await fetch(`/api/admin/suggestions/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Suggestions</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Anonymous feedback submitted from the site or the maintenance page.
      </p>

      {suggestions.length === 0 ? (
        <div className="card-surface p-6 text-center text-[var(--text-muted)] text-sm">No suggestions yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {suggestions.map((s) => (
            <div key={s.id} className="card-surface p-4 flex justify-between items-start gap-4">
              <div>
                <span className="inline-block text-xs font-medium px-2 py-0.5 rounded bg-[var(--surface-muted)] text-[var(--text-muted)] mb-2">
                  {s.source === "maintenance" ? "During maintenance" : "From the site"}
                </span>
                <p className="text-sm whitespace-pre-wrap">{s.message}</p>
                <p className="text-xs text-[var(--text-muted)] mt-2">{formatDateTime(s.createdAt)}</p>
              </div>
              <button onClick={() => remove(s.id)} className="shrink-0 text-[var(--danger)] underline text-xs">
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
