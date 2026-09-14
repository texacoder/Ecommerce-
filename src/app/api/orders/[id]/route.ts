import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { restockOrderItems } from "@/lib/orders";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        user: { select: { id: true, name: true, email: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // Customers may only ever see their own order; admins can see any.
    if (order.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ order });
  } catch (err) {
    return errorResponse(err);
  }
}

// Lets a customer back out of an unpaid order (e.g. they abandoned checkout)
// and releases the stock that was reserved for it.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order || order.userId !== user.id) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (order.status === "CANCELLED") {
      return NextResponse.json({ error: "This order is already cancelled" }, { status: 400 });
    }
    if (order.paymentStatus !== "PENDING" && order.paymentStatus !== "FAILED") {
      return NextResponse.json({ error: "Only unpaid orders can be cancelled this way" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      if (order.stockReserved) {
        await restockOrderItems(tx, order.items);
      }
      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED", stockReserved: false, cancelReason: "Cancelled by customer before payment" },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
