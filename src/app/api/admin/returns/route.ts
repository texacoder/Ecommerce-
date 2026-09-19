import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const returnRequests = await prisma.returnRequest.findMany({
      where: status ? { status: status as "REQUESTED" | "APPROVED" | "REJECTED" } : undefined,
      include: {
        user: { select: { name: true, email: true } },
        order: { select: { id: true, orderNumber: true } },
        orderItem: { select: { nameSnapshot: true, quantity: true, priceSnapshot: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ returnRequests });
  } catch (err) {
    return errorResponse(err);
  }
}
