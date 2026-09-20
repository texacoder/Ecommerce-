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
 * everywhere. Renders nothing at all if the promotion has no image - an
 * image is the whole point of this tile, and a blank box only confuses
 * shoppers, so an admin who forgets to upload one just doesn't get a tile
 * instead of an empty gap. */
export default function PromoTile({ promo }: { promo: PromoTileData }) {
  if (!promo.imageUrl) return null;
  const href = promo.linkUrl ?? (promo.productSlug ? `/products/${promo.productSlug}` : promo.categorySlug ? `/category/${promo.categorySlug}` : "/products");

  return (
    <Link
      href={href}
      className="block rounded-lg overflow-hidden aspect-square"
      style={{ backgroundImage: `url(${promo.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" }}
    />
  );
}
