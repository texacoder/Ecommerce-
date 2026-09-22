"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { optimizedImageUrl } from "@/lib/image";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
};

/** Auto-rotating hero banner for the homepage. Slides come from admin-managed
 * BANNER promotions (Admin -> Promotions -> Add -> type "Banner") - this
 * component just displays whatever it's given and never renders anything
 * (leaving the caller's own empty-state in its place) when there are none. */
export default function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => setActive((i) => (i + 1) % slides.length), 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) return null;
  const current = slides[Math.min(active, slides.length - 1)];

  return (
    <div>
      <Link href={current.linkUrl ?? "/products"} className="block rounded-xl overflow-hidden aspect-[4/3] bg-white/5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={optimizedImageUrl(current.imageUrl, 900)}
          alt=""
          decoding="async"
          className="w-full h-full object-cover"
        />
      </Link>
      {slides.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`Show slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${i === active ? "w-6 bg-white" : "w-1.5 bg-white/40"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
