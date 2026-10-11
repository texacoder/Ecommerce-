import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

export async function GET() {
  try {
    await requireAdmin();
    const missedSearches = await prisma.missedSearch.findMany({ orderBy: { count: "desc" } });
    return NextResponse.json({ missedSearches });
  } catch (err) {
    return errorResponse(err);
  }
}
