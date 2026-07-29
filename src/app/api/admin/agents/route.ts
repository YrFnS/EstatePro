import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

const agentSchema = z.object({
  nameEn: z.string().trim().min(2).max(120),
  nameAr: z.string().trim().min(2).max(120),
  titleEn: z.string().trim().min(2).max(160),
  titleAr: z.string().trim().min(2).max(160),
  bioEn: z.string().trim().max(5_000).optional().default(""),
  bioAr: z.string().trim().max(5_000).optional().default(""),
  email: z.string().trim().email().max(320),
  phone: z.string().trim().min(3).max(50),
  image: z.string().trim().max(2_000).optional().default(""),
  specialization: z.string().trim().min(2).max(80),
  experience: z.number().int().min(0).max(100),
  propertiesCount: z.number().int().min(0).max(1_000_000).optional().default(0),
  rating: z.number().min(0).max(5).optional().default(0),
});

export async function GET(request: NextRequest) {
  try {
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const agents = await db.agent.findMany({
      where: search
        ? {
            OR: [
              { nameEn: { contains: search, mode: "insensitive" } },
              { nameAr: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { specialization: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      orderBy: [{ rating: "desc" }, { nameEn: "asc" }],
      include: {
        _count: { select: { properties: true } },
      },
    });

    return NextResponse.json({ agents });
  } catch (error) {
    console.error("Admin agents list error:", error);
    return NextResponse.json({ error: "Failed to load agents" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const parsed = agentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid agent data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const agent = await db.agent.create({
      data: {
        ...input,
        email: input.email.toLowerCase(),
      },
    });

    return NextResponse.json({ agent }, { status: 201 });
  } catch (error) {
    console.error("Admin agent creation error:", error);
    return NextResponse.json({ error: "Failed to create agent" }, { status: 500 });
  }
}
