import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { assertValidTransition, type OrderStatus } from "@/lib/orders";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ order });
  } catch (err) {
    return errorResponse(err);
  }
}

const updateSchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"])
    .optional(),
  trackingCarrier: z.string().max(80).nullable().optional(),
  trackingNumber: z.string().max(120).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = updateSchema.parse(await req.json());

    const existing = await prisma.order.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    if (body.status) {
      assertValidTransition(existing.status as OrderStatus, body.status);
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        ...(body.status ? { status: body.status } : {}),
        ...(body.trackingCarrier !== undefined ? { trackingCarrier: body.trackingCarrier } : {}),
        ...(body.trackingNumber !== undefined ? { trackingNumber: body.trackingNumber } : {}),
      },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
    });

    return NextResponse.json({ order });
  } catch (err) {
    return errorResponse(err);
  }
}
