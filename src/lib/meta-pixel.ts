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
 * first. Amounts must already be in rupees, not paise.
 *
 * `eventId`, when passed, must match the `event_id` sent for the same
 * event via the Conversions API (see `@/lib/meta-capi`) - that's how Meta
 * deduplicates the browser and server copies of the same event instead of
 * double-counting it. */
export function trackMetaEvent(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) {
    window.fbq("track", event, params, { eventID: eventId });
  } else {
    window.fbq("track", event, params);
  }
}
