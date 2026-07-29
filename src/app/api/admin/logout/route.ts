import { NextResponse } from "next/server";
import {
  ADMIN_NONCE_COOKIE,
  ADMIN_SESSION_COOKIE,
} from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ success: true });
  const options = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: 0,
  };

  response.cookies.set(ADMIN_SESSION_COOKIE, "", options);
  response.cookies.set(ADMIN_NONCE_COOKIE, "", {
    ...options,
    httpOnly: false,
  });

  return response;
}
