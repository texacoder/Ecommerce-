"use client";

import { useState } from "react";

// Shown on every admin page while maintenance mode is on, not just the
// dashboard - an admin who turned it on then went to work on, say, Orders
// has no other reminder it's still blocking every visitor.
export default function MaintenanceBanner({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [busy, setBusy] = useState(false);

  if (!enabled) return null;

  async function turnOff() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings/maintenance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: false }),
      });
      if (res.ok) setEnabled(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-[var(--danger)] text-white text-sm px-4 py-2 flex items-center justify-between gap-3">
      <span>Maintenance mode is ON &mdash; visitors see a &ldquo;back soon&rdquo; page instead of the store.</span>
      <button onClick={turnOff} disabled={busy} className="shrink-0 underline font-medium disabled:opacity-60">
        {busy ? "Turning off…" : "Turn off"}
      </button>
    </div>
  );
}
