import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const customer = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        addresses: true,
        orders: {
          orderBy: { createdAt: "desc" },
          include: { items: true },
        },
      },
    });
    if (!customer || customer.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const totalOrders = customer.orders.length;
    const totalSpent = customer.orders
      .filter((o) => o.status !== "CANCELLED")
      .reduce((s, o) => s + o.total, 0);

    return NextResponse.json({ customer, totalOrders, totalSpent });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }

    const customer = await prisma.user.update({
      where: { id },
      data: { status: body.status },
      select: { id: true, name: true, email: true, role: true, status: true },
    });
    return NextResponse.json({ customer });
  } catch (err) {
    return errorResponse(err);
  }
}
