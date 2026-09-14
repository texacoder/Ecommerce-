import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export const LOW_STOCK_THRESHOLD = 5;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const filter = searchParams.get("filter"); // "low" | "out" | undefined

    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
        ...(q
          ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] }
          : {}),
      },
      include: { variants: true, category: true },
      orderBy: { name: "asc" },
    });

    const rows = products.map((p) => ({
      productId: p.id,
      name: p.name,
      sku: p.sku,
      category: p.category?.name ?? null,
      stock: p.stock,
      lowStock: p.stock > 0 && p.stock <= LOW_STOCK_THRESHOLD,
      outOfStock: p.stock === 0,
      variants: p.variants.map((v) => ({
        variantId: v.id,
        name: v.name,
        sku: v.sku,
        stock: v.stock,
        lowStock: v.stock > 0 && v.stock <= LOW_STOCK_THRESHOLD,
        outOfStock: v.stock === 0,
      })),
    }));

    const filtered =
      filter === "low"
        ? rows.filter((r) => r.lowStock || r.variants.some((v) => v.lowStock))
        : filter === "out"
        ? rows.filter((r) => r.outOfStock || r.variants.some((v) => v.outOfStock))
        : rows;

    return NextResponse.json({ rows: filtered });
  } catch (err) {
    return errorResponse(err);
  }
}

const updateSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  stock: z.number().int().min(0),
});

// Quick stock update from the inventory table, for either a base product or
// a specific variant.
export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = updateSchema.parse(await req.json());
    if (!body.productId && !body.variantId) {
      return NextResponse.json({ error: "productId or variantId is required" }, { status: 400 });
    }

    if (body.variantId) {
      const variant = await prisma.productVariant.update({
        where: { id: body.variantId },
        data: { stock: body.stock },
      });
      return NextResponse.json({ variant });
    }

    const product = await prisma.product.update({
      where: { id: body.productId! },
      data: { stock: body.stock },
    });
    return NextResponse.json({ product });
  } catch (err) {
    return errorResponse(err);
  }
}
