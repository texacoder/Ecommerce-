"use client";

import { useState } from "react";

/** An always-there, low-friction way to flag a problem or suggestion while
 * actually using the site - not just during maintenance. Posts to the same
 * anonymous /api/suggestions endpoint the maintenance page uses. */
export default function FooterSuggestionBox() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function submit() {
    const trimmed = message.trim();
    if (!trimmed) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, source: "site" }),
      });
      if (!res.ok) throw new Error();
      setMessage("");
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="hover:underline text-left">
        Report a problem
      </button>
    );
  }

  return (
    <div className="max-w-xs">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        maxLength={1000}
        placeholder="Tell us what's wrong or what you'd like to see..."
        className="w-full min-h-20 bg-white/10 border border-white/20 rounded-md px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 mb-2"
      />
      <div className="flex items-center gap-3">
        <button
          onClick={submit}
          disabled={status === "sending" || !message.trim()}
          className="bg-[var(--brand-accent)] text-white text-xs font-medium px-3 py-1.5 rounded disabled:opacity-60"
        >
          {status === "sending" ? "Sending…" : "Send"}
        </button>
        {status === "sent" && <span className="text-xs text-green-400">Thanks for letting us know!</span>}
        {status === "error" && <span className="text-xs text-red-400">Something went wrong. Try again.</span>}
      </div>
    </div>
  );
}
