import {
  createHmac,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";

export const ADMIN_SESSION_COOKIE = "admin_guard";
export const ADMIN_NONCE_COOKIE = "admin_token";
export const ADMIN_SESSION_TTL_SECONDS = 8 * 60 * 60;

export interface AdminSessionPayload {
  sub: string;
  email: string;
  role: "admin";
  nonce: string;
  iat: number;
  exp: number;
}

function getAdminSecret(): string {
  const secret = process.env.ADMIN_AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("ADMIN_AUTH_SECRET or NEXTAUTH_SECRET must be configured");
  }
  return secret;
}

function sign(encodedPayload: string): string {
  return createHmac("sha256", getAdminSecret())
    .update(encodedPayload)
    .digest("base64url");
}

function adminCookiesRequireHttps(): boolean {
  const configured = process.env.ADMIN_COOKIE_SECURE?.trim().toLowerCase();

  if (["1", "true", "yes", "on"].includes(configured || "")) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(configured || "")) {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

export function createAdminSession(input: {
  userId: string;
  email: string;
}): {
  token: string;
  nonce: string;
  payload: AdminSessionPayload;
} {
  const now = Math.floor(Date.now() / 1000);
  const nonce = randomBytes(32).toString("base64url");
  const payload: AdminSessionPayload = {
    sub: input.userId,
    email: input.email,
    role: "admin",
    nonce,
    iat: now,
    exp: now + ADMIN_SESSION_TTL_SECONDS,
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  );
  const signature = sign(encodedPayload);

  return {
    token: `${encodedPayload}.${signature}`,
    nonce,
    payload,
  };
}

export function verifyAdminSession(
  token: string | undefined,
  nonce: string | undefined
): AdminSessionPayload | null {
  if (!token || !nonce) return null;

  const [encodedPayload, suppliedSignature, ...extra] = token.split(".");
  if (!encodedPayload || !suppliedSignature || extra.length > 0) return null;

  const expectedSignature = sign(encodedPayload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);

  if (supplied.length !== expected.length) return null;
  if (!timingSafeEqual(supplied, expected)) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<AdminSessionPayload>;
    const now = Math.floor(Date.now() / 1000);

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      payload.role !== "admin" ||
      typeof payload.nonce !== "string" ||
      payload.nonce !== nonce ||
      typeof payload.exp !== "number" ||
      payload.exp <= now
    ) {
      return null;
    }

    return payload as AdminSessionPayload;
  } catch {
    return null;
  }
}

export function adminCookieOptions(httpOnly: boolean) {
  return {
    httpOnly,
    secure: adminCookiesRequireHttps(),
    sameSite: "strict" as const,
    path: "/",
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  };
}