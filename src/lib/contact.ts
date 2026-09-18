// Shared contact details so the WhatsApp button, the Customer Service page,
// and anything else that needs to reach support all stay in sync.
export const WHATSAPP_NUMBER = "918089568674"; // country code + number, no "+"
export const SUPPORT_EMAIL = "exorastorebuz@gmail.com";

export function whatsappLink(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}

export function supportMailtoLink(subject: string): string {
  return `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}
