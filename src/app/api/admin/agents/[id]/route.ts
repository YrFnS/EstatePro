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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const agent = await db.agent.findUnique({
      where: { id },
      include: { _count: { select: { properties: true } } },
    });
    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 });
    }
    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Admin agent lookup error:", error);
    return NextResponse.json({ error: "Failed to load agent" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = agentSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid agent data", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const input = parsed.data;
    const agent = await db.agent.update({
      where: { id },
      data: {
        ...input,
        email: input.email.toLowerCase(),
      },
      include: { _count: { select: { properties: true } } },
    });

    return NextResponse.json({ agent });
  } catch (error) {
    console.error("Admin agent update error:", error);
    return NextResponse.json({ error: "Failed to update agent" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.$transaction([
      db.property.updateMany({ where: { agentId: id }, data: { agentId: null } }),
      db.agent.delete({ where: { id } }),
    ]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin agent deletion error:", error);
    return NextResponse.json({ error: "Failed to delete agent" }, { status: 500 });
  }
}
