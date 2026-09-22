"use client";

import { useEffect, useState } from "react";
import { optimizedImageUrl } from "@/lib/image";

export type HeroSlide = {
  id: string;
  imageUrl: string;
  linkUrl: string | null;
};

/** Full-bleed background image carousel for the homepage hero. Renders as
 * an absolutely-positioned layer that fills whatever size its parent
 * section ends up being (the section's actual height comes from the text
 * content overlaid on top of it, in normal flow) - it never renders
 * anything itself when there are no slides, since the page decides what
 * its own empty-state background looks like.
 *
 * Slides come from admin-managed BANNER promotions (Admin -> Promotions ->
 * Add -> type "Banner"). Since the image is now a backdrop behind other
 * links/buttons rather than a tile of its own, it's no longer clickable -
 * the overlaid "Shop Now" / "Explore Deals" buttons are the real CTAs. */
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
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={current.id}
        src={optimizedImageUrl(current.imageUrl, 1600)}
        alt=""
        decoding="async"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {slides.length > 1 && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center gap-1.5 z-10">
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
    </>
  );
}
