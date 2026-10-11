"use client";

import { useState } from "react";

export default function AnnouncementSettings({
  initialEnabled,
  initialMessage,
}: {
  initialEnabled: boolean;
  initialMessage: string;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState(initialMessage);
  const [saved, setSaved] = useState(true);
  const [busy, setBusy] = useState(false);

  async function save(nextEnabled: boolean, nextMessage: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/settings/announcement", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: nextEnabled, message: nextMessage }),
      });
      if (res.ok) setSaved(true);
    } finally {
      setBusy(false);
    }
  }

  function toggle() {
    const next = !enabled;
    setEnabled(next);
    save(next, message);
  }

  return (
    <div className="card-surface p-4 mb-6">
      <p className="font-semibold mb-0.5">Announcement banner</p>
      <p className="text-sm text-[var(--text-muted)] mb-3">
        A dismissible message shown at the top of every page on the site, for sales, free shipping, anything you want visitors to see right away.
      </p>
      <textarea
        value={message}
        onChange={(e) => {
          setMessage(e.target.value);
          setSaved(false);
        }}
        maxLength={300}
        placeholder="e.g. Free shipping on orders above ₹999 this week!"
        className="w-full min-h-16 border border-[var(--border-subtle)] rounded px-3 py-2 text-sm bg-transparent mb-3"
      />
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={toggle} />
          Show on the site
        </label>
        <button
          onClick={() => save(enabled, message)}
          disabled={busy || saved}
          className="rounded-md btn-primary px-4 py-1.5 text-sm font-medium disabled:opacity-60"
        >
          {busy ? "Saving…" : saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}
