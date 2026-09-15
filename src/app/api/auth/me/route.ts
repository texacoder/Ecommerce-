import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { errorResponse } from "@/lib/api";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ user: null });
    const user = await prisma.user.findUnique({ where: { id: session.sub } });
    if (!user || user.status === "SUSPENDED") return NextResponse.json({ user: null });
    return NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    return errorResponse(err);
  }
}
