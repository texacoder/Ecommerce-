import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const SESSION_COOKIE = "session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not set");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
  email: string;
  name: string;
};

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(getSecretKey());
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

/** Server Components / Route Handlers: read + verify the session cookie. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export class AuthError extends Error {
  status: number;
  constructor(message: string, status = 401) {
    super(message);
    this.status = status;
  }
}

/**
 * Always re-checks the DB (not just the JWT claims) so a session issued
 * before an admin suspends/promotes/demotes an account is never trusted.
 */
export async function requireUser(): Promise<{
  id: string;
  email: string;
  name: string;
  role: "CUSTOMER" | "ADMIN";
  status: "ACTIVE" | "SUSPENDED";
}> {
  const session = await getSession();
  if (!session) throw new AuthError("Not authenticated", 401);
  const user = await prisma.user.findUnique({ where: { id: session.sub } });
  if (!user) throw new AuthError("Not authenticated", 401);
  if (user.status === "SUSPENDED") throw new AuthError("Account suspended", 403);
  return user;
}

/** Server-side authorization gate for every sensitive admin operation. */
export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "ADMIN") throw new AuthError("Admin access required", 403);
  return user;
}
