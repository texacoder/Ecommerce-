import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true, user: { select: { id: true, name: true, email: true } } },
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
