import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    if (!productId) return NextResponse.json({ error: "productId is required" }, { status: 400 });

    const reviews = await prisma.review.findMany({
      where: { productId, status: "PUBLISHED" },
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ reviews });
  } catch (err) {
    return errorResponse(err);
  }
}

const createSchema = z.object({
  productId: z.string(),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(150).optional().nullable(),
  body: z.string().max(3000).optional().nullable(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = createSchema.parse(await req.json());

    const product = await prisma.product.findUnique({ where: { id: body.productId } });
    if (!product || product.deletedAt) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existing = await prisma.review.findUnique({
      where: { productId_userId: { productId: body.productId, userId: user.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "You have already reviewed this product" }, { status: 409 });
    }

    const review = await prisma.review.create({
      data: {
        productId: body.productId,
        userId: user.id,
        rating: body.rating,
        title: body.title ?? null,
        body: body.body ?? null,
      },
    });
    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
