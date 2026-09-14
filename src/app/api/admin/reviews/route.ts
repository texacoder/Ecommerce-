import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const productId = searchParams.get("productId");

    const where: Prisma.ReviewWhereInput = {};
    if (status) where.status = status as Prisma.ReviewWhereInput["status"];
    if (productId) where.productId = productId;

    const reviews = await prisma.review.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  } catch (err) {
    return errorResponse(err);
  }
}
