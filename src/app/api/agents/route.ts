import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const agents = await db.agent.findMany({
      orderBy: { rating: "desc" },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Error fetching agents:", error);
    return NextResponse.json({ agents: [], fallback: true });
  }
}
