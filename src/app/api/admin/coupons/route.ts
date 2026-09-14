import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const createSchema = z.object({
  code: z.string().min(3).max(40),
  type: z.enum(["PERCENT", "FIXED"]),
  value: z.number().int().min(1),
  minOrderValue: z.number().int().min(0).optional().nullable(),
  productId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  expiresAt: z.string().datetime().optional().nullable(),
  usageLimit: z.number().int().min(1).optional().nullable(),
  perCustomerLimit: z.number().int().min(1).optional().nullable(),
  active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    await requireAdmin();
    const coupons = await prisma.coupon.findMany({
      include: { product: { select: { name: true } }, category: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ coupons });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
    const body = createSchema.parse(await req.json());

    if (body.type === "PERCENT" && body.value > 100) {
      return NextResponse.json({ error: "Percentage discount cannot exceed 100" }, { status: 400 });
    }
    if (body.productId && body.categoryId) {
      return NextResponse.json(
        { error: "A coupon can be scoped to a product or a category, not both" },
        { status: 400 }
      );
    }

    const code = body.code.trim().toUpperCase();
    const existing = await prisma.coupon.findUnique({ where: { code } });
    if (existing) return NextResponse.json({ error: "Coupon code already exists" }, { status: 409 });

    const coupon = await prisma.coupon.create({
      data: {
        code,
        type: body.type,
        value: body.value,
        minOrderValue: body.minOrderValue ?? null,
        productId: body.productId ?? null,
        categoryId: body.categoryId ?? null,
        expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
        usageLimit: body.usageLimit ?? null,
        perCustomerLimit: body.perCustomerLimit ?? null,
        active: body.active,
      },
    });
    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
