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

    // A promotion can point at a product/category that's since been
    // unpublished, hidden, or soft-deleted (the FK uses onDelete: SetNull,
    // but unpublishing doesn't clear it) — strip those references here so
    // this public endpoint never exposes a product/category that isn't
    // supposed to be visible on the storefront.
    const sanitized = promotions.map((p) => ({
      ...p,
      product: p.product && p.product.status === "PUBLISHED" && p.product.visible && !p.product.deletedAt ? p.product : null,
      category: p.category && p.category.visible ? p.category : null,
    }));

    return NextResponse.json({ promotions: sanitized });
  } catch (err) {
    return errorResponse(err);
  }
}
