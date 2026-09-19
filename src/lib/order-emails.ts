import { sendEmail } from "@/lib/email";
import { formatMoney } from "@/lib/format";

// Customer-facing order lifecycle emails. Every function here just calls
// sendEmail(), which already never throws and no-ops silently when
// RESEND_API_KEY isn't set - so a failed or skipped send can never break
// the order flow that triggered it (payment, shipping, cancellation...).
// Callers should still only invoke these at a state *transition* (e.g.
// "payment just succeeded", not "order is currently paid"), so retries or
// duplicate webhook deliveries don't re-send the same email.

type EmailOrderItem = { nameSnapshot: string; quantity: number };
type EmailOrder = {
  orderNumber: string;
  total: number;
  items: EmailOrderItem[];
};

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function shell(heading: string, bodyHtml: string): string {
  return `
    <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
      <h2 style="color: #0f172a;">${heading}</h2>
      ${bodyHtml}
      <p style="color: #64748b; font-size: 13px; margin-top: 24px;">
        Questions about this order? Reply to this email or reach us through the Customer Service page on the site.
      </p>
    </div>
  `;
}

function itemsList(items: EmailOrderItem[]): string {
  return `<ul style="padding-left: 18px; color: #334155;">${items
    .map((i) => `<li>${escapeHtml(i.nameSnapshot)} &times; ${i.quantity}</li>`)
    .join("")}</ul>`;
}

export async function sendOrderConfirmedEmail(order: EmailOrder, email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Order confirmed — #${order.orderNumber}`,
    html: shell(
      "Your order is confirmed!",
      `
      <p>Thanks for shopping with EXORASTORE. Order <strong>#${order.orderNumber}</strong> is confirmed.</p>
      ${itemsList(order.items)}
      <p style="font-weight: 600;">Total: ${formatMoney(order.total)}</p>
      <p>We'll email you again once it ships.</p>
      `
    ),
  });
}

export async function sendOrderShippedEmail(
  order: EmailOrder,
  email: string,
  tracking: { carrier: string | null; number: string | null }
): Promise<void> {
  const trackingLine = tracking.number
    ? `<p>Tracking: ${escapeHtml(tracking.carrier ?? "")} ${escapeHtml(tracking.number)}</p>`
    : "";
  await sendEmail({
    to: email,
    subject: `Your order has shipped — #${order.orderNumber}`,
    html: shell(
      "Your order is on its way!",
      `
      <p>Order <strong>#${order.orderNumber}</strong> has shipped.</p>
      ${trackingLine}
      ${itemsList(order.items)}
      `
    ),
  });
}

export async function sendOrderDeliveredEmail(order: EmailOrder, email: string): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Delivered — #${order.orderNumber}`,
    html: shell(
      "Your order has been delivered",
      `
      <p>Order <strong>#${order.orderNumber}</strong> was marked as delivered. We hope you love it!</p>
      ${itemsList(order.items)}
      <p>Not quite right? Eligible items can be returned within 7 days from your Orders page.</p>
      `
    ),
  });
}

export async function sendOrderCancelledEmail(order: EmailOrder, email: string, reason: string | null): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Order cancelled — #${order.orderNumber}`,
    html: shell(
      "Your order was cancelled",
      `
      <p>Order <strong>#${order.orderNumber}</strong> has been cancelled${reason ? `: ${escapeHtml(reason)}` : "."}</p>
      <p>If you were charged, the payment will be refunded to your original payment method.</p>
      `
    ),
  });
}

export async function sendOrderRefundedEmail(
  order: EmailOrder,
  email: string,
  amount: number,
  fullyRefunded: boolean
): Promise<void> {
  await sendEmail({
    to: email,
    subject: `Refund ${fullyRefunded ? "completed" : "processed"} — #${order.orderNumber}`,
    html: shell(
      "Your refund has been processed",
      `
      <p>We've processed a refund of <strong>${formatMoney(amount)}</strong> for order <strong>#${order.orderNumber}</strong>.</p>
      <p>It can take 5-7 business days to reflect in your original payment method.</p>
      `
    ),
  });
}
