import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const category = searchParams.get("category");
    const featured = searchParams.get("featured");
    const bestSeller = searchParams.get("bestSeller");
    const newArrival = searchParams.get("newArrival");
    const sort = searchParams.get("sort") ?? "newest";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(60, Math.max(1, Number(searchParams.get("pageSize") ?? "24")));

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      status: "PUBLISHED",
      visible: true,
    };
    if (category) where.category = { slug: category };
    if (featured === "true") where.isFeatured = true;
    if (bestSeller === "true") where.isBestSeller = true;
    if (newArrival === "true") where.isNewArrival = true;
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { brand: { contains: q } },
        { description: { contains: q } },
      ];
    }

    const orderBy: Prisma.ProductOrderByWithRelationInput =
      sort === "price_asc"
        ? { price: "asc" }
        : sort === "price_desc"
        ? { price: "desc" }
        : sort === "name"
        ? { name: "asc" }
        : { createdAt: "desc" };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true, images: { orderBy: { position: "asc" }, take: 1 } },
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({ products, total, page, pageSize });
  } catch (err) {
    return errorResponse(err);
  }
}
