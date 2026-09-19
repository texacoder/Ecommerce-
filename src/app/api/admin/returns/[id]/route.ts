import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const updateSchema = z.object({ status: z.enum(["APPROVED", "REJECTED"]) });

// Accept/reject only - deliberately doesn't touch payment/refund status.
// An approved return still needs the admin to separately issue a refund
// (the existing per-order refund action) once the item is actually back,
// rather than this auto-refunding on approval alone.
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { status } = updateSchema.parse(await req.json());

    const existing = await prisma.returnRequest.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Return request not found" }, { status: 404 });

    // Conditional on status="REQUESTED" in the same query (not a separate
    // check-then-write) so two near-simultaneous decisions on the same
    // request - a double-click, two admin tabs - can't race: only the
    // first to actually land updates anything, the second gets 0 rows.
    const { count } = await prisma.returnRequest.updateMany({
      where: { id, status: "REQUESTED" },
      data: { status },
    });
    if (count === 0) {
      const current = await prisma.returnRequest.findUnique({ where: { id } });
      return NextResponse.json(
        { error: `This return request was already ${(current?.status ?? existing.status).toLowerCase()}` },
        { status: 400 }
      );
    }

    const returnRequest = await prisma.returnRequest.findUnique({ where: { id } });
    return NextResponse.json({ returnRequest });
  } catch (err) {
    return errorResponse(err);
  }
}
