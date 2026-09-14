import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { verifyPassword, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }
    if (user.status === "SUSPENDED") {
      return NextResponse.json({ error: "This account has been suspended" }, { status: 403 });
    }

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
