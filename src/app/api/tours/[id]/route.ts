import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";

const updateTourSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

async function canManageTour(
  user: { id: string; email: string; role: string },
  tour: { email: string; propertyId: string }
): Promise<boolean> {
  if (user.role === "admin") return true;
  if (user.role !== "agent") {
    return tour.email.toLowerCase() === user.email.toLowerCase();
  }

  const agent = await db.agent.findUnique({
    where: { email: user.email.toLowerCase() },
    select: { id: true },
  });
  if (!agent) return false;

  const property = await db.property.findFirst({
    where: { id: tour.propertyId, agentId: agent.id },
    select: { id: true },
  });
  return Boolean(property);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const parsed = updateTourSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid tour status" }, { status: 400 });
    }

    const tour = await db.tour.findUnique({
      where: { id },
      select: { id: true, email: true, propertyId: true, status: true },
    });
    if (!tour || !(await canManageTour(user, tour))) {
      return NextResponse.json({ error: "Tour not found" }, { status: 404 });
    }

    if (user.role !== "admin" && user.role !== "agent" && parsed.data.status !== "cancelled") {
      return NextResponse.json(
        { error: "Customers may only cancel their own tours" },
        { status: 403 }
      );
    }

    if (tour.status === "completed" && parsed.data.status !== "completed") {
      return NextResponse.json(
        { error: "Completed tours cannot be changed" },
        { status: 409 }
      );
    }

    const updated = await db.tour.update({
      where: { id },
      data: { status: parsed.data.status },
    });

    return NextResponse.json({ tour: updated });
  } catch (error) {
    console.error("Tour update error:", error);
    return NextResponse.json({ error: "Failed to update tour" }, { status: 500 });
  }
}
