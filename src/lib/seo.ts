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
