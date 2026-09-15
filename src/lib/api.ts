import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError } from "@/lib/auth";
import { AppError } from "@/lib/errors";

const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

export function errorResponse(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof AppError) {
    // A deliberately-thrown, human-written message (validation, business
    // rules like stock/coupon checks) — safe to show the customer as-is.
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      { error: "Validation failed", issues: err.issues },
      { status: 400 }
    );
  }
  // Anything else is unexpected — a bug, a database error, a third-party
  // SDK failure, a missing env var, etc. Never surface its raw message to
  // the client; log the full detail server-side (visible in Vercel's
  // function logs) and return a generic, safe message instead.
  console.error("[API] Unexpected error:", err);
  return NextResponse.json({ error: GENERIC_ERROR_MESSAGE }, { status: 500 });
}

export function generateOrderNumber(): string {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}
