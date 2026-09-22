import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const updateSchema = z.object({
  code: z.string().min(3).max(40).optional(),
  type: z.enum(["PERCENT", "FIXED"]).optional(),
  value: z.number().int().min(1).optional(),
  minOrderValue: z.number().int().min(0).nullable().optional(),
  productId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  usageLimit: z.number().int().min(1).nullable().optional(),
  perCustomerLimit: z.number().int().min(1).nullable().optional(),
  active: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const existing = await prisma.coupon.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Coupon not found" }, { status: 404 });

    // A partial update only sends the fields being changed, so these rules
    // (enforced on creation) have to be re-checked against the *resulting*
    // record, not just the fields in this request - otherwise e.g. PATCHing
    // only `type: "PERCENT"` onto a coupon whose value is still 500 (valid
    // as a FIXED amount, meaningless as a percent) would silently produce a
    // 500%-off coupon with no validation catching it at all.
    const finalType = body.type ?? existing.type;
    const finalValue = body.value ?? existing.value;
    if (finalType === "PERCENT" && finalValue > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
    }
    const finalProductId = body.productId !== undefined ? body.productId : existing.productId;
    const finalCategoryId = body.categoryId !== undefined ? body.categoryId : existing.categoryId;
    if (finalProductId && finalCategoryId) {
      return NextResponse.json(
        { error: "A coupon can be scoped to a product or a category, not both" },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = { ...body };
    if (body.code) {
      const code = body.code.trim().toUpperCase();
      const taken = await prisma.coupon.findFirst({ where: { code, NOT: { id } } });
      if (taken) return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });
      data.code = code;
    }
    if (body.expiresAt !== undefined) {
      data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    }

    const coupon = await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ coupon });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
