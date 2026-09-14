import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { Prisma } from "@prisma/client";

// Never selects passwordHash — admins must never see credentials.
const customerSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  _count: { select: { orders: true } },
} satisfies Prisma.UserSelect;

export async function GET(req: NextRequest) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q")?.trim();
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const pageSize = Math.min(100, Math.max(1, Number(searchParams.get("pageSize") ?? "25")));

    const where: Prisma.UserWhereInput = { role: "CUSTOMER" };
    if (q) {
      where.OR = [{ name: { contains: q } }, { email: { contains: q } }];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: customerSelect,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    // Aggregate spend per customer (delivered/paid orders only skew less
    // useful for admins than total spend across all non-cancelled orders).
    const spendByUser = await prisma.order.groupBy({
      by: ["userId"],
      where: { userId: { in: customers.map((c) => c.id) }, status: { not: "CANCELLED" } },
      _sum: { total: true },
    });
    const spendMap = new Map(spendByUser.map((s) => [s.userId, s._sum.total ?? 0]));

    const rows = customers.map((c) => ({ ...c, totalSpent: spendMap.get(c.id) ?? 0 }));

    return NextResponse.json({ customers: rows, total, page, pageSize });
  } catch (err) {
    return errorResponse(err);
  }
}
