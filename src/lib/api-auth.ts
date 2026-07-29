import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";

export interface CurrentUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar: string | null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.id || !user.email || !user.name) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role || "user",
    avatar: user.avatar || null,
  };
}

export function unauthorized(message = "Authentication required") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "You do not have permission to perform this action") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function isStaffRole(role: string): boolean {
  return role === "admin" || role === "agent";
}
