import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const addSchema = z.object({ optionProductId: z.string().min(1) });

// Links two products as selectable options of each other (e.g. different
// designs of the same mousepad). Always created symmetrically - a customer
// looking at either product should see the other listed as an option,
// regardless of which one an admin happened to edit.
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { optionProductId } = addSchema.parse(await req.json());

    if (optionProductId === id) {
      return NextResponse.json({ error: "A product can't be linked as its own option" }, { status: 400 });
    }

    const [product, optionProduct] = await Promise.all([
      prisma.product.findUnique({ where: { id } }),
      prisma.product.findUnique({ where: { id: optionProductId } }),
    ]);
    if (!product || !optionProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    await prisma.$transaction([
      prisma.productOptionLink.upsert({
        where: { productId_optionProductId: { productId: id, optionProductId } },
        create: { productId: id, optionProductId },
        update: {},
      }),
      prisma.productOptionLink.upsert({
        where: { productId_optionProductId: { productId: optionProductId, optionProductId: id } },
        create: { productId: optionProductId, optionProductId: id },
        update: {},
      }),
    ]);

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    return errorResponse(err);
  }
}
