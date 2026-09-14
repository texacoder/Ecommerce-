import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  fullName: z.string().min(1).optional(),
  line1: z.string().min(1).optional(),
  line2: z.string().nullable().optional(),
  city: z.string().min(1).optional(),
  state: z.string().min(1).optional(),
  postalCode: z.string().min(1).optional(),
  country: z.string().min(1).optional(),
  phone: z.string().min(1).optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });

    const body = schema.parse(await req.json());
    if (body.isDefault) {
      await prisma.address.updateMany({ where: { userId: user.id }, data: { isDefault: false } });
    }
    const address = await prisma.address.update({ where: { id }, data: body });
    return NextResponse.json({ address });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const existing = await prisma.address.findFirst({ where: { id, userId: user.id } });
    if (!existing) return NextResponse.json({ error: "Address not found" }, { status: 404 });
    await prisma.address.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
