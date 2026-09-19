import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Account/checkout/admin/auth pages are either private, require a
      // session, or have nothing worth indexing (a cart, a login form) -
      // keep crawlers on the actual storefront and product pages instead.
      disallow: ["/admin", "/account", "/api", "/checkout", "/cart", "/login", "/register", "/forgot-password", "/reset-password"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
