import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    if (!q || q.length < 2) return NextResponse.json({ suggestions: [] });

    const [products, categories, brands] = await Promise.all([
      prisma.product.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          visible: true,
          name: { contains: q, mode: "insensitive" },
        },
        select: { id: true, name: true, slug: true, images: { orderBy: { position: "asc" }, take: 1 } },
        take: 6,
      }),
      prisma.category.findMany({
        where: { visible: true, name: { contains: q, mode: "insensitive" } },
        select: { id: true, name: true, slug: true },
        take: 3,
      }),
      prisma.product.findMany({
        where: {
          deletedAt: null,
          status: "PUBLISHED",
          brand: { contains: q, mode: "insensitive" },
        },
        select: { brand: true },
        distinct: ["brand"],
        take: 3,
      }),
    ]);

    return NextResponse.json({
      suggestions: {
        products: products.map((p) => ({ id: p.id, name: p.name, slug: p.slug, image: p.images[0]?.url ?? null })),
        categories: categories.map((c) => ({ id: c.id, name: c.name, slug: c.slug })),
        brands: brands.map((b) => b.brand).filter(Boolean),
      },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
