import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/seed-data";

export const dynamic = "force-dynamic";

// One-time bootstrap endpoint for populating a fresh production database.
// Protected by SETUP_SECRET rather than admin auth, since the first deploy
// has no admin user yet. Safe to call repeatedly: seedDatabase() only
// upserts/creates records that don't already exist. GET is supported (in
// addition to POST) so it can be triggered by simply visiting a URL from a
// browser, with the secret passed as a query param.
async function runSeed(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET is not configured" }, { status: 503 });
  }
  const provided = req.headers.get("x-setup-secret") || req.nextUrl.searchParams.get("secret");
  if (provided !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmail = req.nextUrl.searchParams.get("adminEmail") || "texacoderzz@gmail.com";

  try {
    const log = await seedDatabase(prisma, adminEmail);
    return NextResponse.json({ success: true, log });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return runSeed(req);
}

export async function GET(req: NextRequest) {
  return runSeed(req);
}
