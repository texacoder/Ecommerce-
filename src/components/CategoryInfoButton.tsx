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
          {/* The box's own position is relative to the button, but the
              button can sit anywhere horizontally depending on how long the
              category name is - a fixed-width box anchored to it easily runs
              off the right edge of a phone screen. Below sm:, it's "fixed"
              with both edges pinned to the viewport (inset-x-4) instead, so
              it can never overflow regardless of the button's position or
              the screen width; sm: and up reverts to the anchored tooltip,
              which already has enough room. */}
          <div className="fixed inset-x-4 top-32 sm:absolute sm:inset-x-auto sm:left-0 sm:top-7 sm:w-72 sm:max-w-[80vw] z-40 bg-[var(--surface)] border border-[var(--border-subtle)] rounded-md shadow-lg p-3 text-sm font-normal text-[var(--text-muted)] leading-relaxed">
            {description}
          </div>
        </>
      )}
    </span>
  );
}
