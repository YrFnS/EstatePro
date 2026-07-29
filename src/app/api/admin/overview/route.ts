import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const [properties, agents, users, inquiries, tours, pendingTours, messages] =
      await Promise.all([
        db.property.count(),
        db.agent.count(),
        db.user.count(),
        db.inquiry.count(),
        db.tour.count(),
        db.tour.count({ where: { status: "pending" } }),
        db.contactMessage.count(),
      ]);

    const recentTours = await db.tour.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        propertyId: true,
        name: true,
        email: true,
        date: true,
        time: true,
        status: true,
        createdAt: true,
      },
    });

    const recentInquiries = await db.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        name: true,
        email: true,
        propertyId: true,
        message: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      counts: {
        properties,
        agents,
        users,
        inquiries,
        tours,
        pendingTours,
        messages,
      },
      recentTours,
      recentInquiries,
    });
  } catch (error) {
    console.error("Admin overview error:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard overview" },
      { status: 500 }
    );
  }
}
