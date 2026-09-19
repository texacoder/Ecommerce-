// Matches the window stated on the refund policy page - keep both in sync
// if this ever changes.
export const RETURN_WINDOW_DAYS = 7;

export function returnWindowClosesAt(deliveredAt: Date): Date {
  return new Date(deliveredAt.getTime() + RETURN_WINDOW_DAYS * 24 * 60 * 60 * 1000);
}

export function isReturnWindowOpen(deliveredAt: Date | null): boolean {
  if (!deliveredAt) return false;
  return new Date() <= returnWindowClosesAt(deliveredAt);
}
