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

/** Renders one admin-managed promotion (banner/deal/sale-campaign) as a
 * clickable tile. Shared by the homepage hero, the deals page, and the
 * sale-campaign strip so a single admin edit looks consistent everywhere. */
export default function PromoTile({ promo, tone = "dark" }: { promo: PromoTileData; tone?: "dark" | "light" }) {
  const href = promo.linkUrl ?? (promo.productSlug ? `/products/${promo.productSlug}` : promo.categorySlug ? `/category/${promo.categorySlug}` : "/products");

  return (
    <Link
      href={href}
      className={`relative rounded-lg overflow-hidden aspect-[4/3] flex flex-col justify-end p-4 ${tone === "dark" ? "bg-white/5" : "bg-[var(--surface-muted)]"}`}
      style={promo.imageUrl ? { backgroundImage: `url(${promo.imageUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      <div className={`absolute inset-0 ${tone === "dark" ? "bg-black/30" : "bg-black/10"}`} />
      <div className={`relative ${tone === "dark" ? "text-white" : "text-[var(--text)]"}`}>
        <h3 className="font-bold text-sm">{promo.title}</h3>
        {promo.subtitle && <p className="text-xs opacity-90 line-clamp-2">{promo.subtitle}</p>}
      </div>
    </Link>
  );
}
