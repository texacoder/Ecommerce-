"use client";

import { useState } from "react";

export default function ProductGallery({ images, name }: { images: { id: string; url: string }[]; name: string }) {
  const [active, setActive] = useState(0);
  const current = images[active] ?? images[0];

  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-square rounded-lg overflow-hidden bg-[var(--surface-muted)] border border-[var(--border-subtle)] flex items-center justify-center">
        {current ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={current.url} alt={name} className="w-full h-full object-contain p-6" />
        ) : (
          <span className="text-sm text-[var(--text-faint)]">No image available</span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              className={`w-16 h-16 rounded overflow-hidden bg-[var(--surface-muted)] border ${
                i === active ? "border-[var(--brand-accent)] ring-1 ring-[var(--brand-accent)]" : "border-[var(--border-subtle)]"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-contain p-1" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
