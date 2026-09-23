// Single source of truth for the site's public URL and name, used by
// metadata, canonical links, JSON-LD structured data, and the sitemap/robots
// routes - so a domain change only means updating NEXT_PUBLIC_APP_URL.
export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
export const SITE_NAME = "EXORASTORE";
export const SITE_DESCRIPTION =
  "EXORASTORE is an online marketplace for electronics, fashion, home & kitchen, beauty, accessories and sports gear, with real-time pricing, secure checkout, and cash on delivery.";

// Demo/seed products use an inline data: URI SVG as a placeholder image
// (see seed-data.ts) - that's fine to render in an <img> tag, but it's
// meaningless (and invalid per Google's Product structured data rules) as
// an og:image or JSON-LD image, which must be a real fetchable http(s)
// URL. Guard every use of a product/category photo in metadata or
// structured data with this rather than assuming any non-empty string is
// safe to hand to a crawler.
export function isCrawlableImageUrl(url: string | null | undefined): url is string {
  return typeof url === "string" && /^https?:\/\//.test(url);
}

// Google's Merchant listing structured data check flags a "name" field with
// "Invalid string length" when it's empty or unreasonably long. The admin
// form enforces a sane length on write, but a row created before that check
// existed (or edited directly) isn't guaranteed to respect it, so structured
// data trims/caps names at render time rather than trusting the database.
export function structuredDataName(value: string | null | undefined, maxLength = 150): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) return undefined;
  return trimmed.length > maxLength ? trimmed.slice(0, maxLength).trim() : trimmed;
}
