import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getMaintenanceMode, setMaintenanceMode } from "@/lib/settings";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json({ enabled: await getMaintenanceMode() });
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({ enabled: z.boolean() });

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const { enabled } = schema.parse(await req.json());
    await setMaintenanceMode(enabled);
    return NextResponse.json({ enabled });
  } catch (err) {
    return errorResponse(err);
  }
}
