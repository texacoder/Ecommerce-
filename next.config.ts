import type { NextConfig } from "next";

// Baseline security headers on every response. Deliberately not shipping a
// Content-Security-Policy here: this app loads Razorpay's checkout script
// from an external origin and shows data: URI placeholder images, and a
// CSP tight enough to matter but loose enough not to break either needs
// more care/testing than a drive-by addition — worth doing as its own,
// separately verified change later.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
