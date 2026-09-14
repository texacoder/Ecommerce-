import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const product = await prisma.product.findFirst({
      where: { slug, deletedAt: null, status: "PUBLISHED", visible: true },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        reviews: {
          where: { status: "PUBLISHED" },
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const avgRating =
      product.reviews.length > 0
        ? product.reviews.reduce((s, r) => s + r.rating, 0) / product.reviews.length
        : null;

    return NextResponse.json({ product, avgRating, reviewCount: product.reviews.length });
  } catch (err) {
    return errorResponse(err);
  }
}
