import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const suggestions = await prisma.suggestion.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ suggestions });
  } catch (err) {
    return errorResponse(err);
  }
}
