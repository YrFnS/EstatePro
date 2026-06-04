import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get("propertyId");

    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId query parameter is required" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");
    const reviews = await db.review.findMany({
      where: { propertyId },
      orderBy: { createdAt: "desc" },
    });

    // Calculate average rating
    const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

    return NextResponse.json({
      reviews,
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews: reviews.length,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ reviews: [], averageRating: 0, totalReviews: 0, fallback: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { propertyId, authorName, rating, comment } = body;

    // Validate required fields
    if (!propertyId) {
      return NextResponse.json(
        { error: "propertyId is required" },
        { status: 400 }
      );
    }

    if (!authorName || typeof authorName !== "string" || !authorName.trim()) {
      return NextResponse.json(
        { error: "authorName is required" },
        { status: 400 }
      );
    }

    if (!comment || typeof comment !== "string" || !comment.trim()) {
      return NextResponse.json(
        { error: "comment is required" },
        { status: 400 }
      );
    }

    // Validate rating
    const parsedRating = Number(rating);
    if (
      !Number.isInteger(parsedRating) ||
      parsedRating < 1 ||
      parsedRating > 5
    ) {
      return NextResponse.json(
        { error: "rating must be an integer between 1 and 5" },
        { status: 400 }
      );
    }

    const { db } = await import("@/lib/db");

    // Verify property exists
    const property = await db.property.findUnique({
      where: { id: propertyId },
    });

    if (!property) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const review = await db.review.create({
      data: {
        propertyId,
        authorName: authorName.trim(),
        rating: parsedRating,
        comment: comment.trim(),
      },
    });

    return NextResponse.json(review, { status: 201 });
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ review: null, fallback: true });
  }
}
