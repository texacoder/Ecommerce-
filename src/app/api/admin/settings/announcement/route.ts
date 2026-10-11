import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { getAnnouncement, setAnnouncement } from "@/lib/settings";

export async function GET() {
  try {
    await requireAdmin();
    return NextResponse.json(await getAnnouncement());
  } catch (err) {
    return errorResponse(err);
  }
}

const schema = z.object({ enabled: z.boolean(), message: z.string().trim().max(300) });

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
    const body = schema.parse(await req.json());
    await setAnnouncement(body.enabled, body.message);
    return NextResponse.json(body);
  } catch (err) {
    return errorResponse(err);
  }
}
