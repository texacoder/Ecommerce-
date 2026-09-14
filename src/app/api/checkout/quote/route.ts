import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { computeQuote } from "@/lib/pricing";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string(),
        variantId: z.string().optional().nullable(),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  couponCode: z.string().optional().nullable(),
});

// Live totals preview for the checkout page. Always recomputed from the
// database — the client only supplies product/variant ids and quantities.
export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());
    const quote = await computeQuote(body.items, body.couponCode, user.id);
    return NextResponse.json({ quote });
  } catch (err) {
    return errorResponse(err);
  }
}
