import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth";

// Edge-safe JWT check. This is a first line of defense that keeps customers
// out of /admin pages entirely; every actual admin mutation additionally
// re-verifies the user's role against the database in requireAdmin().
async function readRole(request: NextRequest): Promise<{ role?: string; status?: string } | null> {
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const secret = process.env.JWT_SECRET;
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    return payload as { role?: string; status?: string };
  } catch {
    return null;
  }
}

// Paths that must keep working while MAINTENANCE_MODE is on, so the admin
// can still sign in and run the dashboard. Everything else - every
// storefront page and public API - gets the maintenance response instead.
// Razorpay's webhook is allowed through too since it's a server-to-server
// call, not a customer visiting the site, and blocking it could strand the
// payment confirmation for an order placed right before maintenance began.
const MAINTENANCE_ALLOWED_PREFIXES = ["/admin", "/login", "/api/admin", "/api/auth", "/api/payments/webhook"];

function isAllowedDuringMaintenance(pathname: string): boolean {
  if (MAINTENANCE_ALLOWED_PREFIXES.some((p) => pathname.startsWith(p))) return true;
  if (pathname.startsWith("/_next")) return true;
  // Static files (favicon, logo, fonts, css/js chunks) - safe to keep
  // serving regardless of maintenance mode, and the admin UI needs them.
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

const MAINTENANCE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>EXORASTORE is down for maintenance</title>
<style>
  * { box-sizing: border-box; }
  body {
    margin: 0;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #101a2c;
    color: #ffffff;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    padding: 24px;
    text-align: center;
  }
  .card { max-width: 440px; }
  img { width: 64px; height: 64px; border-radius: 14px; margin-bottom: 24px; }
  h1 { font-size: 24px; font-weight: 700; margin: 0 0 12px; }
  p { color: #93a3bd; font-size: 15px; line-height: 1.6; margin: 0; }
</style>
</head>
<body>
  <div class="card">
    <img src="/icon.png" alt="EXORASTORE" />
    <h1>We'll be back soon</h1>
    <p>EXORASTORE is currently undergoing scheduled maintenance. Thanks for your patience &mdash; please check back shortly.</p>
  </div>
</body>
</html>`;

function maintenanceResponse(): NextResponse {
  return new NextResponse(MAINTENANCE_HTML, {
    status: 503,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "retry-after": "3600",
    },
  });
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.MAINTENANCE_MODE === "true" && !isAllowedDuringMaintenance(pathname)) {
    return maintenanceResponse();
  }

  if (pathname.startsWith("/admin")) {
    const session = await readRole(request);
    if (!session || session.role !== "ADMIN" || session.status === "SUSPENDED") {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/account")) {
    const session = await readRole(request);
    if (!session || session.status === "SUSPENDED") {
      const url = new URL("/login", request.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/api/admin")) {
    const session = await readRole(request);
    if (!session || session.role !== "ADMIN" || session.status === "SUSPENDED") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
