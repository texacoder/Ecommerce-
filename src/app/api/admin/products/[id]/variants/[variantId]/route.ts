import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  sku: z.string().min(1).max(80).optional(),
  attributes: z.string().nullable().optional(),
  priceOverride: z.number().int().min(0).nullable().optional(),
  stock: z.number().int().min(0).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin();
    const { id, variantId } = await params;
    const body = updateSchema.parse(await req.json());

    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId: id } });
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });

    if (body.sku && body.sku !== variant.sku) {
      const taken = await prisma.productVariant.findUnique({ where: { sku: body.sku } });
      if (taken) return NextResponse.json({ error: "Variant SKU already in use" }, { status: 409 });
    }

    const updated = await prisma.productVariant.update({ where: { id: variantId }, data: body });
    return NextResponse.json({ variant: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; variantId: string }> }
) {
  try {
    await requireAdmin();
    const { id, variantId } = await params;
    const variant = await prisma.productVariant.findFirst({ where: { id: variantId, productId: id } });
    if (!variant) return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    await prisma.productVariant.delete({ where: { id: variantId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
