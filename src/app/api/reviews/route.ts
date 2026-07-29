import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";

const reviewSchema = z.object({
  propertyId: z.string().trim().min(1),
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().min(3).max(2_000),
});

export async function GET(request: NextRequest) {
  const propertyId = request.nextUrl.searchParams.get("propertyId")?.trim();
  if (!propertyId) {
    return NextResponse.json(
      { error: "propertyId query parameter is required" },
      { status: 400 }
    );
  }

  try {
    const reviews = await db.review.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
      take: 200,
    });
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = reviews.length ? totalRating / reviews.length : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const parsed = reviewSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid review", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const property = await db.property.findUnique({
      where: { id: parsed.data.propertyId },
      select: { id: true },
    });
    if (!property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const review = await db.review.create({
      data: {
        propertyId: parsed.data.propertyId,
        authorName: user.name,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
