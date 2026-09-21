// Meta (Facebook/Instagram) Pixel - client-side only. The pixel ID isn't
// secret (it's visible in every page's source anyway), but it's still an
// env var rather than hardcoded so it can be changed/removed without a
// code change, matching how every other optional integration in this app
// (Razorpay, Cloudinary, Resend) is configured.
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;
export const isMetaPixelConfigured = Boolean(META_PIXEL_ID);

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fires a Meta Pixel standard event. A no-op if the pixel isn't configured
 * or hasn't loaded yet (e.g. an ad blocker) - callers never need to check
 * first. Amounts must already be in rupees, not paise. */
export function trackMetaEvent(event: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  window.fbq("track", event, params);
}
