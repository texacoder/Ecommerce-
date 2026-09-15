/**
 * Marks an error as deliberately thrown with a safe, human-readable message
 * meant to be shown to the end user as-is (e.g. "Only 3 units in stock",
 * "Coupon has expired"). errorResponse() in @/lib/api treats this — and
 * AuthError, and anything extending it (PricingError, UploadValidationError)
 * — as safe to pass through. Any other thrown error (a bug, a Prisma/DB
 * error, a third-party SDK failure) is never shown to the client raw; it's
 * logged server-side and replaced with a generic message instead.
 */
export class AppError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
