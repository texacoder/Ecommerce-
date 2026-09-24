import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

// Admin-only, read-diagnostic endpoint: posts one clearly-labeled test row
// to the configured Google Sheets webhook (the exact same request shape
// syncOrderToSheet sends for a real order) and reports back exactly what
// happened, since a real order sync fails silently by design (see
// src/lib/google-sheets.ts) and only ever shows up in Vercel's short-lived
// function logs otherwise. Safe to leave in place; delete the resulting
// "DIAGNOSTIC-TEST" row from the sheet afterward.
export async function GET() {
  try {
    await requireAdmin();

    const url = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    const secret = process.env.GOOGLE_SHEETS_SECRET;
    if (!url || !secret) {
      return NextResponse.json({
        configured: false,
        message: "GOOGLE_SHEETS_WEBHOOK_URL and/or GOOGLE_SHEETS_SECRET is not set in this environment.",
      });
    }

    const payload = {
      secret,
      orderNumber: "DIAGNOSTIC-TEST",
      date: new Date().toISOString(),
      customerName: "Diagnostic Test",
      email: "diagnostic-test@example.com",
      phone: "0000000000",
      address: "This row was created by the sheet-sync diagnostic tool - safe to delete",
      products: "N/A",
      total: "0.00",
      paymentStatus: "PAID",
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      });
      const text = await res.text();
      return NextResponse.json({
        configured: true,
        webhookUrl: url,
        httpStatus: res.status,
        responseBody: text,
      });
    } catch (fetchErr) {
      return NextResponse.json({
        configured: true,
        webhookUrl: url,
        error: fetchErr instanceof Error ? fetchErr.message : String(fetchErr),
      });
    }
  } catch (err) {
    return errorResponse(err);
  }
}
