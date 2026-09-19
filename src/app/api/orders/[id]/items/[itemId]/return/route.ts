import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { isReturnWindowOpen } from "@/lib/returns";

const schema = z.object({ reason: z.string().trim().min(1).max(1000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const user = await requireUser();
    const { id, itemId } = await params;
    const { reason } = schema.parse(await req.json());

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status !== "DELIVERED") {
      return NextResponse.json({ error: "This order hasn't been delivered yet" }, { status: 400 });
    }
    if (!isReturnWindowOpen(order.deliveredAt)) {
      return NextResponse.json({ error: "The 7-day return window for this order has closed" }, { status: 400 });
    }

    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { product: { select: { isReturnable: true } }, returnRequest: true },
    });
    if (!item || item.orderId !== order.id) {
      return NextResponse.json({ error: "Order item not found" }, { status: 404 });
    }
    if (!item.product?.isReturnable) {
      return NextResponse.json({ error: "This item isn't eligible for return" }, { status: 400 });
    }
    if (item.returnRequest) {
      return NextResponse.json({ error: "A return has already been requested for this item" }, { status: 409 });
    }

    const returnRequest = await prisma.returnRequest.create({
      data: { orderId: order.id, orderItemId: item.id, userId: user.id, reason },
    });

    return NextResponse.json({ returnRequest }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
