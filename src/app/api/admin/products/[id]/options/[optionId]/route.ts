import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

// Removes the link in both directions - see the sibling POST route for why.
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; optionId: string }> }) {
  try {
    await requireAdmin();
    const { id, optionId } = await params;

    await prisma.productOptionLink.deleteMany({
      where: {
        OR: [
          { productId: id, optionProductId: optionId },
          { productId: optionId, optionProductId: id },
        ],
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err);
  }
}
