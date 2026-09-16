import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { hashPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { errorResponse } from "@/lib/api";
import { enforceRateLimit, getClientIp } from "@/lib/rate-limit";

const schema = z.object({
  name: z.string().min(1).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    // Limits mass account creation from a single source (bots, abuse).
    await enforceRateLimit(prisma, `register:ip:${getClientIp(req)}`, { max: 5, windowMs: 60 * 60 * 1000 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 409 });
    }

    const passwordHash = await hashPassword(body.password);
    const user = await prisma.user.create({
      data: { name: body.name.trim(), email, passwordHash, role: "CUSTOMER" },
    });

    const token = await createSessionToken({
      sub: user.id,
      role: user.role,
      status: user.status,
      email: user.email,
      name: user.name,
    });

    const res = NextResponse.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
    return res;
  } catch (err) {
    return errorResponse(err);
  }
}
