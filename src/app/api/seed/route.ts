import { NextResponse } from "next/server";

const message =
  "The public seed endpoint is disabled. Seed data through a controlled deployment task instead.";

export async function GET() {
  return NextResponse.json({ error: message }, { status: 404 });
}

export async function POST() {
  return NextResponse.json({ error: message }, { status: 404 });
}
