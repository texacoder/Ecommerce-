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

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
  matcher: ["/admin/:path*", "/account/:path*", "/api/admin/:path*"],
};
