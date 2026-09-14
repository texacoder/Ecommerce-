import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const now = new Date();

    const promotions = await prisma.promotion.findMany({
      where: {
        active: true,
        ...(type ? { type: type as "BANNER" | "FEATURED_SECTION" | "DEAL" | "SALE_CAMPAIGN" } : {}),
        AND: [
          { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
          { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
        ],
      },
      include: {
        product: {
          include: { images: { orderBy: { position: "asc" }, take: 1 } },
        },
        category: true,
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json({ promotions });
  } catch (err) {
    return errorResponse(err);
  }
}
