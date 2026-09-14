import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser, createSessionToken, SESSION_COOKIE } from "@/lib/auth";
import { errorResponse } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().toLowerCase().email(),
});

export async function PATCH(req: NextRequest) {
  try {
    const user = await requireUser();
    const body = schema.parse(await req.json());

    const existing = await prisma.user.findUnique({ where: { email: body.email } });
    if (existing && existing.id !== user.id) {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { name: body.name, email: body.email },
    });

    // The session JWT carries name/email as claims, so it must be reissued
    // here — otherwise the header, account page, etc. would keep showing
    // the old values until the next login.
    const token = await createSessionToken({
      sub: updated.id,
      role: updated.role,
      status: updated.status,
      email: updated.email,
      name: updated.name,
    });

    const res = NextResponse.json({
      user: { id: updated.id, name: updated.name, email: updated.email, role: updated.role },
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
