import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  type: z.enum(["BANNER", "FEATURED_SECTION", "DEAL", "SALE_CAMPAIGN"]).optional(),
  title: z.string().min(1).max(200).optional(),
  subtitle: z.string().max(300).nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  linkUrl: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  position: z.number().int().min(0).optional(),
  active: z.boolean().optional(),
  startsAt: z.string().datetime().nullable().optional(),
  endsAt: z.string().datetime().nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = schema.parse(await req.json());

    const existing = await prisma.promotion.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Promotion not found" }, { status: 404 });

    // Same "impossible active window" check as creation, but against the
    // *resulting* dates - a PATCH that only sends one of the two fields
    // still has to be checked against whichever one isn't changing.
    const finalStartsAt = body.startsAt !== undefined ? body.startsAt : existing.startsAt?.toISOString() ?? null;
    const finalEndsAt = body.endsAt !== undefined ? body.endsAt : existing.endsAt?.toISOString() ?? null;
    if (finalStartsAt && finalEndsAt && new Date(finalEndsAt) <= new Date(finalStartsAt)) {
      return NextResponse.json({ error: "End date must be after the start date" }, { status: 400 });
    }

    const data: Record<string, unknown> = { ...body };
    if (body.startsAt !== undefined) data.startsAt = body.startsAt ? new Date(body.startsAt) : null;
    if (body.endsAt !== undefined) data.endsAt = body.endsAt ? new Date(body.endsAt) : null;
    const promotion = await prisma.promotion.update({ where: { id }, data });
    return NextResponse.json({ promotion });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.promotion.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
