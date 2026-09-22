"use client";

import { useState } from "react";

/** Category pages used to show their description as an always-visible
 * paragraph under the heading, on every category - a bit of copy most
 * shoppers skip past to get to the products. Tucked behind an "i" button
 * instead, shown only if asked for. */
export default function CategoryInfoButton({ description }: { description: string }) {
  const [open, setOpen] = useState(false);

  return (
    <span className="relative inline-block align-middle ml-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="About this category"
        aria-expanded={open}
        className="w-5 h-5 rounded-full border border-[var(--border-subtle)] text-[var(--text-muted)] text-xs font-semibold flex items-center justify-center hover:bg-[var(--surface-muted)]"
      >
        i
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} aria-hidden="true" />
          <div className="absolute left-0 top-7 z-40 w-72 max-w-[80vw] bg-[var(--surface)] border border-[var(--border-subtle)] rounded-md shadow-lg p-3 text-sm font-normal text-[var(--text-muted)] leading-relaxed">
            {description}
          </div>
        </>
      )}
    </span>
  );
}
