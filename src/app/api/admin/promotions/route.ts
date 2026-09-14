import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  type: z.enum(["BANNER", "FEATURED_SECTION", "DEAL", "SALE_CAMPAIGN"]),
  title: z.string().min(1).max(200),
  subtitle: z.string().max(300).optional().nullable(),
  imageUrl: z.string().optional().nullable(),
  linkUrl: z.string().optional().nullable(),
  productId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  position: z.number().int().min(0).optional().default(0),
  active: z.boolean().optional().default(true),
  startsAt: z.string().datetime().optional().nullable(),
  endsAt: z.string().datetime().optional().nullable(),
});

export async function GET() {
  try {
    await requireAdmin();
    const promotions = await prisma.promotion.findMany({
      include: { product: { select: { name: true, slug: true } }, category: { select: { name: true, slug: true } } },
      orderBy: [{ type: "asc" }, { position: "asc" }],
    });
    return NextResponse.json({ promotions });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    const promotion = await prisma.promotion.create({
      data: {
        ...body,
        startsAt: body.startsAt ? new Date(body.startsAt) : null,
        endsAt: body.endsAt ? new Date(body.endsAt) : null,
      },
    });
    return NextResponse.json({ promotion }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
