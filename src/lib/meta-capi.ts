// Server-side counterpart to the browser Meta Pixel: reports a Purchase
// directly from our server, right when an order is marked PAID. This is
// what recovers sales the browser pixel misses - ad blockers, Safari's
// Intelligent Tracking Prevention, and users who close the confirmation
// tab before it loads all silently drop the client-side event, but never
// this one. Best-effort only, same as the Google Sheets sync: a failed or
// unconfigured send must never break order confirmation.
import crypto from "crypto";
import { META_PIXEL_ID } from "@/lib/meta-pixel";
import { SITE_URL } from "@/lib/seo";

const ACCESS_TOKEN = process.env.META_CONVERSIONS_API_ACCESS_TOKEN;

function sha256(value: string): string {
  return crypto.createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

type PurchaseOrder = {
  id: string;
  total: number;
  addressSnapshot: string;
  items: { productId: string | null; variantId: string | null }[];
};

export async function sendMetaPurchaseEvent(order: PurchaseOrder, email: string): Promise<void> {
  if (!META_PIXEL_ID || !ACCESS_TOKEN) return;

  let phone: string | undefined;
  try {
    const address = JSON.parse(order.addressSnapshot);
    if (typeof address.phone === "string" && address.phone.trim()) {
      phone = address.phone.replace(/\D/g, "");
    }
  } catch {
    // malformed/missing snapshot - send without phone match data
  }

  const contentIds = order.items.map((i) => i.variantId ?? i.productId).filter((id): id is string => id !== null);

  const payload = {
    data: [
      {
        event_name: "Purchase",
        event_time: Math.floor(Date.now() / 1000),
        // Must match the `eventID` passed to fbq() for this same order on
        // the confirmation page, so Meta merges the two into one event
        // instead of counting the sale twice.
        event_id: order.id,
        action_source: "website",
        event_source_url: `${SITE_URL}/order-confirmation/${order.id}`,
        user_data: {
          em: [sha256(email)],
          ...(phone ? { ph: [sha256(phone)] } : {}),
        },
        custom_data: {
          currency: "INR",
          value: order.total / 100,
          content_ids: contentIds,
          content_type: "product",
        },
      },
    ],
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`[meta-capi] send responded with ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[meta-capi] send failed:", err);
  }
}
