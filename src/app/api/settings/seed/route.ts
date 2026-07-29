import { NextResponse } from "next/server";

const message =
  "The public settings seed endpoint is disabled. Manage site settings from the protected admin API.";

export async function GET() {
  return NextResponse.json({ error: message }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: message }, { status: 404 });
}
