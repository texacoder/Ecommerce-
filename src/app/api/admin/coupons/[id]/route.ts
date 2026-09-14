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
