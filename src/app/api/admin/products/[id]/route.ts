import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { computeDiscountPercent } from "@/lib/pricing";

const updateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().nullable().optional(),
  specifications: z.string().nullable().optional(),
  price: z.number().int().min(0).optional(),
  originalPrice: z.number().int().min(0).nullable().optional(),
  shippingCost: z.number().int().min(0).optional(),
  sku: z.string().min(1).max(80).optional(),
  brand: z.string().max(120).nullable().optional(),
  categoryId: z.string().nullable().optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(["PUBLISHED", "DRAFT", "UNPUBLISHED"]).optional(),
  isFeatured: z.boolean().optional(),
  isBestSeller: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  isReturnable: z.boolean().optional(),
  codAvailable: z.boolean().optional(),
  visible: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        optionLinks: {
          include: { optionProduct: { select: { id: true, name: true, sku: true, price: true } } },
        },
      },
    });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
    return NextResponse.json({ product });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    if (body.sku && body.sku !== existing.sku) {
      const skuTaken = await prisma.product.findUnique({ where: { sku: body.sku } });
      if (skuTaken) return NextResponse.json({ error: "SKU already in use" }, { status: 409 });
    }

    // Reviving a soft-deleted product happens explicitly via republish.
    const data: Record<string, unknown> = { ...body };
    if (body.status === "PUBLISHED") data.deletedAt = null;

    // Same rule as creation: discountPercent is never taken from the
    // request, even though the field exists in the schema below (some
    // callers still send whatever they last displayed) - it's recomputed
    // from the *resulting* price/originalPrice so the "X% off" badge can
    // never claim a discount larger than what the prices actually show.
    const finalPrice = body.price ?? existing.price;
    const finalOriginalPrice = body.originalPrice !== undefined ? body.originalPrice : existing.originalPrice;
    data.discountPercent = computeDiscountPercent(finalPrice, finalOriginalPrice);

    const product = await prisma.product.update({
      where: { id },
      data,
      include: {
        category: true,
        images: { orderBy: { position: "asc" } },
        variants: true,
        optionLinks: {
          include: { optionProduct: { select: { id: true, name: true, sku: true, price: true } } },
        },
      },
    });

    return NextResponse.json({ product });
  } catch (err) {
    return errorResponse(err);
  }
}

// Soft delete: preserves the row (and every OrderItem snapshot referencing
// it) so historical orders keep rendering correctly; the product just stops
// being purchasable or visible in the storefront.
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    if (searchParams.get("confirm") !== "true") {
      return NextResponse.json(
        { error: "Deletion requires confirm=true to prevent accidental deletion" },
        { status: 400 }
      );
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const product = await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date(), status: "UNPUBLISHED", visible: false },
    });

    return NextResponse.json({ product });
  } catch (err) {
    return errorResponse(err);
  }
}
