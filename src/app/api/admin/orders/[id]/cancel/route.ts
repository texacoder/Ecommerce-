import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { restockOrderItems } from "@/lib/orders";

const schema = z.object({ reason: z.string().max(500).optional() });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json().catch(() => ({})));

    const order = await prisma.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.status === "CANCELLED" || order.status === "DELIVERED" || order.status === "REFUNDED") {
      return NextResponse.json(
        { error: `Order is ${order.status.toLowerCase()} and cannot be cancelled` },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (order.stockReserved) {
        await restockOrderItems(tx, order.items);
      }

      return tx.order.update({
        where: { id },
        data: { status: "CANCELLED", stockReserved: false, cancelReason: body.reason ?? null },
        include: { items: true, user: { select: { id: true, name: true, email: true } } },
      });
    });

    return NextResponse.json({ order: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
