import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1).max(120),
  sku: z.string().min(1).max(80),
  attributes: z.string().optional().nullable(),
  priceOverride: z.number().int().min(0).optional().nullable(),
  stock: z.number().int().min(0).default(0),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = createSchema.parse(await req.json());

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const skuTaken = await prisma.productVariant.findUnique({ where: { sku: body.sku } });
    if (skuTaken) return NextResponse.json({ error: "Variant SKU already in use" }, { status: 409 });

    const variant = await prisma.productVariant.create({
      data: { productId: id, ...body },
    });
    return NextResponse.json({ variant }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
