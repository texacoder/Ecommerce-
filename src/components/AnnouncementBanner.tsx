"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dismissedAnnouncement";

export default function AnnouncementBanner({ message }: { message: string }) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(sessionStorage.getItem(STORAGE_KEY) === message);
    } catch {
      setDismissed(false);
    }
  }, [message]);

  if (dismissed) return null;

  return (
    <div className="bg-[var(--brand-accent)] text-white text-sm">
      <div className="container-page py-2 flex items-center justify-between gap-4">
        <p className="flex-1">{message}</p>
        <button
          onClick={() => {
            setDismissed(true);
            try {
              sessionStorage.setItem(STORAGE_KEY, message);
            } catch {}
          }}
          aria-label="Dismiss announcement"
          className="shrink-0 opacity-80 hover:opacity-100"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
