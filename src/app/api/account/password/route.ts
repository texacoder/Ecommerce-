import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "New password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const fullUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fullUser || !(await verifyPassword(body.currentPassword, fullUser.passwordHash))) {
      return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
    }

    const passwordHash = await hashPassword(body.newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    return NextResponse.json({ success: true });
  } catch (err) {
    return errorResponse(err);
  }
}
