import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { seedDatabase } from "@/lib/seed-data";
import { hashPassword } from "@/lib/auth";
import { secureCompare } from "@/lib/secure-compare";

export const dynamic = "force-dynamic";

// The one bootstrap admin identity this endpoint is allowed to touch.
// Intentionally not settable via query param/input — letting the caller
// name an arbitrary target email here would turn this into a general
// "reset anyone's password" tool instead of a bounded recovery lever for
// the site owner's own first-admin account.
const BOOTSTRAP_ADMIN_EMAIL = "texacoderzz@gmail.com";
const BOOTSTRAP_ADMIN_PASSWORD = "Admin123!";

// One-time bootstrap endpoint for populating a fresh production database.
// Protected by SETUP_SECRET rather than admin auth, since the first deploy
// has no admin user yet. Safe to call repeatedly: seedDatabase() only
// upserts/creates records that don't already exist, and never touches an
// existing user's password. GET is supported (in addition to POST) so it
// can be triggered by simply visiting a URL from a browser, with the
// secret passed as a query param.
//
// Passing `&resetAdminPassword=true` additionally resets
// BOOTSTRAP_ADMIN_EMAIL's password back to BOOTSTRAP_ADMIN_PASSWORD — an
// explicit, deliberate recovery step for when the site owner locks
// themselves out (e.g. by changing that account's password and forgetting
// it) and no email provider is configured to deliver a normal reset link.
async function runSeed(req: NextRequest) {
  const secret = process.env.SETUP_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "SETUP_SECRET is not configured" }, { status: 503 });
  }
  const provided = req.headers.get("x-setup-secret") || req.nextUrl.searchParams.get("secret");
  if (!secureCompare(provided, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const log = await seedDatabase(prisma, BOOTSTRAP_ADMIN_EMAIL);

    if (req.nextUrl.searchParams.get("resetAdminPassword") === "true") {
      const passwordHash = await hashPassword(BOOTSTRAP_ADMIN_PASSWORD);
      await prisma.user.update({ where: { email: BOOTSTRAP_ADMIN_EMAIL }, data: { passwordHash } });
      log.push(`Password reset for ${BOOTSTRAP_ADMIN_EMAIL}.`);
    }

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
