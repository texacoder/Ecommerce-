"use client";

import { useEffect, useState } from "react";
import { formatDateTime } from "@/lib/format";

type MissedSearch = { id: string; query: string; count: number; lastSearchedAt: string };

export default function AdminMissedSearchesPage() {
  const [missedSearches, setMissedSearches] = useState<MissedSearch[]>([]);

  async function load() {
    const res = await fetch("/api/admin/missed-searches");
    const data = await res.json();
    setMissedSearches(data.missedSearches ?? []);
  }

  useEffect(() => {
    load();
  }, []);

  async function remove(id: string) {
    await fetch(`/api/admin/missed-searches/${id}`, { method: "DELETE" });
    load();
  }

  return (
    <div>
      <h1 className="text-xl font-semibold mb-2">Missed Searches</h1>
      <p className="text-sm text-[var(--text-muted)] mb-6">
        Search terms that came back with no results, most-searched first - a signal for what to stock next.
      </p>

      {missedSearches.length === 0 ? (
        <div className="card-surface p-6 text-center text-[var(--text-muted)] text-sm">
          No missed searches yet.
        </div>
      ) : (
        <div className="border border-[var(--border-subtle)] rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left bg-[var(--surface-muted)]">
                <th className="p-3">Search term</th>
                <th className="p-3">Times searched</th>
                <th className="p-3">Last searched</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {missedSearches.map((m) => (
                <tr key={m.id} className="border-t border-[var(--border-subtle)]">
                  <td className="p-3 font-medium">{m.query}</td>
                  <td className="p-3">{m.count}</td>
                  <td className="p-3">{formatDateTime(m.lastSearchedAt)}</td>
                  <td className="p-3">
                    <button onClick={() => remove(m.id)} className="text-[var(--danger)] underline text-xs">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
