// Pushes a paid order's details to a Google Sheet via a Google Apps Script
// "Web App" deployment - no Google Cloud project or service account needed.
// Best-effort only: a failed sync must never break order confirmation, so
// this never throws.
type OrderForSheet = {
  orderNumber: string;
  createdAt: Date;
  total: number;
  paymentStatus: string;
  addressSnapshot: string;
  items: { nameSnapshot: string; quantity: number }[];
};

export async function syncOrderToSheet(order: OrderForSheet, customerEmail: string): Promise<void> {
  const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
  const secret = process.env.GOOGLE_SHEETS_SECRET;
  if (!url || !secret) return;

  let address: Record<string, unknown> = {};
  try {
    address = JSON.parse(order.addressSnapshot);
  } catch {
    // malformed/missing snapshot - sync with what we have rather than failing
  }

  const addressLine = [address.line1, address.line2, address.city, address.state, address.postalCode, address.country]
    .filter(Boolean)
    .join(", ");
  const products = order.items.map((i) => `${i.nameSnapshot} x${i.quantity}`).join(", ");

  const payload = {
    secret,
    orderNumber: order.orderNumber,
    date: order.createdAt.toISOString(),
    customerName: address.fullName ?? "",
    email: customerEmail,
    phone: address.phone ?? "",
    address: addressLine,
    products,
    total: (order.total / 100).toFixed(2),
    paymentStatus: order.paymentStatus,
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.error(`[google-sheets] sync responded with ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error("[google-sheets] sync failed:", err);
  }
}
