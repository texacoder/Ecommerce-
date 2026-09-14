import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { computeQuote } from "@/lib/pricing";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  code: z.string().min(1),
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
});

// Customers submit a code during checkout; the server recomputes discount
// eligibility from scratch rather than trusting anything from the client.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const quote = await computeQuote(body.items, body.code, user.id);
    if (quote.couponError) {
      return NextResponse.json({ valid: false, error: quote.couponError }, { status: 400 });
    }
    return NextResponse.json({ valid: true, quote });
  } catch (err) {
    return errorResponse(err);
  }
}
