import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const replaceSchema = z.object({ url: z.string().min(1) });

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;
    const body = replaceSchema.parse(await req.json());
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    const updated = await prisma.productImage.update({ where: { id: imageId }, data: { url: body.url } });
    return NextResponse.json({ image: updated });
  } catch (err) {
    return errorResponse(err);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; imageId: string }> }
) {
  try {
    await requireAdmin();
    const { id, imageId } = await params;
    const image = await prisma.productImage.findFirst({ where: { id: imageId, productId: id } });
    if (!image) return NextResponse.json({ error: "Image not found" }, { status: 404 });
    await prisma.productImage.delete({ where: { id: imageId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
