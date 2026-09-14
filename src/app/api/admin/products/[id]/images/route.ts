import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const addSchema = z.object({ url: z.string().min(1) });
const reorderSchema = z.object({ order: z.array(z.string()).min(1) });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = addSchema.parse(await req.json());

    const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
    if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

    const maxPosition = product.images.reduce((m, i) => Math.max(m, i.position), -1);
    const image = await prisma.productImage.create({
      data: { productId: id, url: body.url, position: maxPosition + 1 },
    });
    return NextResponse.json({ image }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}

// Reorders images given a full ordered list of image ids for this product.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = reorderSchema.parse(await req.json());

    const images = await prisma.productImage.findMany({ where: { productId: id } });
    const idSet = new Set(images.map((i) => i.id));
    if (body.order.length !== images.length || !body.order.every((imgId) => idSet.has(imgId))) {
      return NextResponse.json({ error: "Order must include every image exactly once" }, { status: 400 });
    }

    await prisma.$transaction(
      body.order.map((imageId, position) =>
        prisma.productImage.update({ where: { id: imageId }, data: { position } })
      )
    );

    const updated = await prisma.productImage.findMany({
      where: { productId: id },
      orderBy: { position: "asc" },
    });
    return NextResponse.json({ images: updated });
  } catch (err) {
    return errorResponse(err);
  }
}
