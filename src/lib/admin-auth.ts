import { createHmac, createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

export const ADMIN_SESSION_COOKIE = "clothestown_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

interface AdminSessionPayload {
  sub: "admin";
  email: string;
  exp: number;
}

function getAuthConfig() {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (!email || !password || !secret || secret.length < 32) {
    return null;
  }

  return { email, password, secret };
}

export function isAdminAuthConfigured() {
  return getAuthConfig() !== null;
}

function constantTimeEqual(left: string, right: string) {
  const leftDigest = createHash("sha256").update(left).digest();
  const rightDigest = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftDigest, rightDigest);
}

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function verifyAdminCredentials(email: string, password: string) {
  const config = getAuthConfig();
  if (!config) return false;

  return (
    constantTimeEqual(email.trim().toLowerCase(), config.email) &&
    constantTimeEqual(password, config.password)
  );
}

export function createAdminSessionToken(email: string) {
  const config = getAuthConfig();
  if (!config) {
    throw new Error("Admin authentication environment variables are missing.");
  }

  const payload: AdminSessionPayload = {
    sub: "admin",
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_MAX_AGE,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, config.secret)}`;
}

export function verifyAdminSessionToken(token: string | undefined) {
  const config = getAuthConfig();
  if (!config || !token) return false;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return false;

  const encodedPayload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const expectedSignature = sign(encodedPayload, config.secret);
  if (!constantTimeEqual(suppliedSignature, expectedSignature)) return false;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<AdminSessionPayload>;

    return (
      payload.sub === "admin" &&
      typeof payload.email === "string" &&
      constantTimeEqual(payload.email, config.email) &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function getAdminSessionToken(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;

  const sessionCookie = cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));

  return sessionCookie?.slice(ADMIN_SESSION_COOKIE.length + 1);
}

export function requireAdmin(request: Request) {
  if (!getAuthConfig()) {
    return NextResponse.json(
      { message: "Admin authentication is not configured on this server." },
      { status: 503 }
    );
  }

  if (!verifyAdminSessionToken(getAdminSessionToken(request))) {
    return NextResponse.json({ message: "Admin authentication required." }, {
      status: 401,
    });
  }

  return null;
}
