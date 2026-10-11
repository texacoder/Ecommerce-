"use client";

import { useState } from "react";

// Always visible on every admin page (not just when it's on, and not just
// on the Dashboard) - a toggle that only lived on one page was easy to
// lose track of, both to find in the first place and to remember it's
// still active while working somewhere else in the dashboard.
export default function MaintenanceBanner({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    const next = !enabled;
    if (
      next &&
      !confirm(
        'Turn maintenance mode ON? Every visitor will see a "back soon" page instead of the store until you turn it off again. You\'ll still be able to use this admin dashboard.'
      )
    ) {
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
      className={`text-sm px-4 py-2 flex items-center justify-between gap-3 ${
        enabled ? "bg-[var(--danger)] text-white" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"
      }`}
    >
      <span>
        {enabled
          ? "Maintenance mode is ON — visitors see a “back soon” page instead of the store."
          : "Maintenance mode is off — the store is open to visitors."}
      </span>
      <button
        onClick={toggle}
        disabled={busy}
        className={`shrink-0 font-medium disabled:opacity-60 ${enabled ? "underline" : "text-[var(--brand-accent)] hover:underline"}`}
      >
        {busy ? "Saving…" : enabled ? "Turn off" : "Turn on"}
      </button>
    </div>
  );
}
