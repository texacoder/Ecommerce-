import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getAnalyticsData } from "@/lib/analytics";

export async function GET() {
  try {
    await requireAdmin();
    const data = await getAnalyticsData();
    return NextResponse.json(data);
  } catch (err) {
    return errorResponse(err);
  }
}
