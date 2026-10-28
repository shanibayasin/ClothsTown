import { createHmac, timingSafeEqual } from "node:crypto";

export const CUSTOMER_SESSION_COOKIE = "clothestown_customer_session";
export const CUSTOMER_SESSION_MAX_AGE = 60 * 60 * 24;
export const CUSTOMER_REMEMBERED_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

interface CustomerSessionPayload {
  sub: string;
  email: string;
  exp: number;
}

function getSessionSecret() {
  const secret =
    process.env.CUSTOMER_SESSION_SECRET ?? process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

export function isCustomerAuthConfigured() {
  return getSessionSecret() !== null;
}

function sign(payload: string, secret: string) {
  const key = createHmac("sha256", secret)
    .update("clothestown:customer-session:v1")
    .digest();
  return createHmac("sha256", key).update(payload).digest("base64url");
}

export function createCustomerSessionToken(
  customer: { id: string; email: string },
  maxAge: number
) {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("Customer session signing secret is not configured.");
  }

  const payload: CustomerSessionPayload = {
    sub: customer.id,
    email: customer.email,
    exp: Math.floor(Date.now() / 1000) + maxAge,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyCustomerSessionToken(token: string | undefined) {
  const secret = getSessionSecret();
  if (!secret || !token) return null;

  const separator = token.lastIndexOf(".");
  if (separator < 1) return null;

  const encodedPayload = token.slice(0, separator);
  const suppliedSignature = token.slice(separator + 1);
  const expectedSignature = sign(encodedPayload, secret);
  const suppliedBuffer = Buffer.from(suppliedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    suppliedBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(suppliedBuffer, expectedBuffer)
  ) {
    return null;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<CustomerSessionPayload>;

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.exp !== "number" ||
      payload.exp <= Math.floor(Date.now() / 1000)
    ) {
      return null;
    }

    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

export function getCustomerSessionToken(request: Request) {
  const cookie = request.headers.get("cookie");
  if (!cookie) return undefined;

  return cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${CUSTOMER_SESSION_COOKIE}=`))
    ?.slice(CUSTOMER_SESSION_COOKIE.length + 1);
}
