import Link from "next/link";

export type PromoTileData = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string | null;
  linkUrl: string | null;
  productSlug?: string | null;
  categorySlug?: string | null;
};

/** Renders one admin-managed promotion (banner/deal) as a clickable image
 * tile - just the photo, no title/subtitle overlay. Shared by the homepage
 * hero and the deals row so a single admin edit looks consistent
 * everywhere. */
export default function PromoTile({ promo, tone = "dark" }: { promo: PromoTileData; tone?: "dark" | "light" }) {
  const href = promo.linkUrl ?? (promo.productSlug ? `/products/${promo.productSlug}` : promo.categorySlug ? `/category/${promo.categorySlug}` : "/products");
  const hasImage = Boolean(promo.imageUrl);

  return (
    <Link
      href={href}
      className={`block rounded-lg overflow-hidden aspect-square ${hasImage ? "" : tone === "dark" ? "bg-white/5" : "bg-[var(--surface-muted)]"}`}
      style={promo.imageUrl ? { backgroundImage: `url(${promo.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    />
  );
}
