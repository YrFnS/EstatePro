import { NextRequest, NextResponse } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_guard";
const ADMIN_NONCE_COOKIE = "admin_token";

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function utf8Bytes(value: string): Uint8Array<ArrayBuffer> {
  const encoded = new TextEncoder().encode(value);
  const bytes = new Uint8Array(new ArrayBuffer(encoded.byteLength));
  bytes.set(encoded);
  return bytes;
}

function decodePayload(value: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(value)));
}

async function verifyAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const nonce = request.cookies.get(ADMIN_NONCE_COOKIE)?.value;
  const secret = process.env.ADMIN_AUTH_SECRET || process.env.NEXTAUTH_SECRET;

  if (!token || !nonce || !secret) return false;

  const [encodedPayload, signature, ...extra] = token.split(".");
  if (!encodedPayload || !signature || extra.length > 0) return false;

  try {
    const key = await crypto.subtle.importKey(
      "raw",
      utf8Bytes(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );

    const validSignature = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signature),
      utf8Bytes(encodedPayload)
    );
    if (!validSignature) return false;

    const payload = decodePayload(encodedPayload) as {
      role?: unknown;
      nonce?: unknown;
      exp?: unknown;
    };

    return (
      payload.role === "admin" &&
      payload.nonce === nonce &&
      typeof payload.exp === "number" &&
      payload.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  if (
    pathname === "/api/admin/login" ||
    pathname === "/api/admin/logout"
  ) {
    return NextResponse.next();
  }

  if (!(await verifyAdminRequest(request))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/admin/:path*"],
};
