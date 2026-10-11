import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const isDev = process.env.NODE_ENV === "development";

// Flip this to true only after a real checkout has been run in production
// with the Report-Only header deployed and the browser console shows no
// CSP violations for it - see the header comment below for why this
// can't be verified end-to-end from this sandbox first.
const ENFORCE_CSP = false;

// Every external origin the app actually loads from: Razorpay's checkout
// widget (script + the payment iframe it opens + its own API/analytics
// calls), Meta Pixel (inline bootstrap script + its tracking beacon),
// Cloudinary (real product photos). 'unsafe-inline' stays on script-src/
// style-src rather than moving to a nonce - nonces require every page to
// be dynamically rendered (no static optimization anywhere, including
// pages with no other reason to be dynamic), which is a much bigger
// trade-off than this app needs for the actual goal here: restricting
// *which origins* can load/execute/connect, not eliminating inline code.
const cspDirectives = [
  "default-src 'self'",
  // 'unsafe-eval' only in dev: React's dev-mode error overlay uses eval()
  // to reconstruct server-side stack traces in the browser; neither React
  // nor Next.js use eval in production, so production doesn't carry the
  // extra allowance.
  `script-src 'self' 'unsafe-inline' https://checkout.razorpay.com https://connect.facebook.net${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://res.cloudinary.com https://www.facebook.com https://*.razorpay.com",
  "font-src 'self'",
  "connect-src 'self' https://*.razorpay.com https://www.facebook.com",
  "frame-src https://*.razorpay.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  // Meaningless (and logged as a console notice on every page) under a
  // Report-Only policy, since it has no violation to report - only takes
  // effect once ENFORCE_CSP actually turns the policy on.
  ...(ENFORCE_CSP ? ["upgrade-insecure-requests"] : []),
].join("; ");

// This sandbox's own network policy blocks outbound requests to
// razorpay.com/facebook.com/cloudinary.com entirely, so the exact
// subdomains and request types Razorpay's checkout iframe needs can't be
// verified end-to-end from here - getting this wrong in enforcing mode
// could silently break real payments. Report-Only never blocks anything;
// it only logs violations to the browser console, which is why
// ENFORCE_CSP (above) defaults to false regardless of environment.
const cspHeader = { key: ENFORCE_CSP ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only", value: cspDirectives };

const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [...securityHeaders, cspHeader] }];
  },
};

export default nextConfig;
