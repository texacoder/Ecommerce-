import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      where: { visible: true },
      include: { _count: { select: { products: { where: { status: "PUBLISHED", visible: true, deletedAt: null } } } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ categories });
  } catch (err) {
    return errorResponse(err);
  }
}
