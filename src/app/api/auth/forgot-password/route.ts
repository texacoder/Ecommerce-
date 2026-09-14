import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { errorResponse } from "@/lib/api";

const schema = z.object({ email: z.string().email() });

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Real password-reset architecture: a single-use, hashed, expiring token is
 * stored server-side and the raw token only ever leaves the server inside
 * a reset link. No email provider is configured in this environment, so
 * the link is logged server-side (and returned in the response outside of
 * production only, for local testing) instead of actually being emailed —
 * wire up an email provider (e.g. Resend, SendGrid) to send it for real.
 *
 * Always responds with the same generic message whether or not the email
 * exists, to avoid leaking which addresses have accounts.
 */
export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const email = body.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({ where: { email } });

    let devResetLink: string | undefined;

    if (user && user.status === "ACTIVE") {
      const { token, hash } = generateToken();
      await prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: hash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) },
      });
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
      const link = `${baseUrl}/reset-password?token=${token}`;
      console.log(`[password reset] Link for ${email}: ${link}`);
      if (process.env.NODE_ENV !== "production") {
        devResetLink = link;
      }
    }

    return NextResponse.json({
      message: "If an account with that email exists, a password reset link has been sent.",
      ...(devResetLink ? { devResetLink } : {}),
    });
  } catch (err) {
    return errorResponse(err);
  }
}
