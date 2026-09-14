import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const updateSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  title: z.string().max(150).nullable().optional(),
  body: z.string().max(3000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own review" }, { status: 403 });
    }

    const body = updateSchema.parse(await req.json());
    const review = await prisma.review.update({ where: { id }, data: body });
    return NextResponse.json({ review });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.review.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Review not found" }, { status: 404 });
    if (existing.userId !== user.id && user.role !== "ADMIN") {
      return NextResponse.json({ error: "You can only delete your own review" }, { status: 403 });
    }
    await prisma.review.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
