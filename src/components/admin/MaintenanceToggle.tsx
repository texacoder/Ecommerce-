"use client";

import { useState } from "react";

export default function MaintenanceToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !enabled;
    if (next && !confirm("Turn maintenance mode ON? Every visitor will see a \"back soon\" page instead of the store until you turn it off again. You'll still be able to use this admin dashboard.")) {
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      });
      if (res.ok) setEnabled(next);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className={`card-surface p-4 mb-6 flex items-center justify-between gap-4 ${
        enabled ? "border-[var(--danger)]" : ""
      }`}
    >
      <div>
        <p className="font-semibold flex items-center gap-2">
          {enabled && <span className="w-2 h-2 rounded-full bg-[var(--danger)]" aria-hidden="true" />}
          Maintenance mode
        </p>
        <p className="text-sm text-[var(--text-muted)] mt-0.5">
          {enabled
            ? "The store is currently closed to visitors - they see a \"back soon\" page. You can still use this dashboard."
            : "The store is open. Turn this on to temporarily close the storefront to visitors while you keep working here."}
        </p>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${
          enabled ? "bg-[var(--danger)] text-white" : "btn-primary"
        }`}
      >
        {busy ? "Saving…" : enabled ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}
