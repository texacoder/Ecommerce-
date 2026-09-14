import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { generateToken } from "@/lib/tokens";
import { errorResponse } from "@/lib/api";
import { sendEmail, isEmailConfigured } from "@/lib/email";

const schema = z.object({ email: z.string().email() });

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Real password-reset architecture: a single-use, hashed, expiring token is
 * stored server-side and the raw token only ever leaves the server inside
 * a reset link. When RESEND_API_KEY is set, that link is actually emailed;
 * otherwise it's only logged server-side (and returned in the response
 * outside of production, for local testing without an email provider).
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

      if (isEmailConfigured()) {
        await sendEmail({
          to: email,
          subject: "Reset your NEXORA password",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #0f172a;">Reset your password</h2>
              <p>We received a request to reset the password for your NEXORA account (${email}).</p>
              <p style="margin: 24px 0;">
                <a href="${link}" style="background: #0e7c6b; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;">
                  Reset password
                </a>
              </p>
              <p style="color: #64748b; font-size: 13px;">This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>
            </div>
          `,
        });
      } else if (process.env.NODE_ENV !== "production") {
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
