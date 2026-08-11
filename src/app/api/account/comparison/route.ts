import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import {
  MAX_COMPARISON_ITEMS,
  uniqueIds,
} from "@/lib/account-state";

const replaceSchema = z.object({
  ids: z
    .array(z.string().trim().min(1).max(200))
    .max(MAX_COMPARISON_ITEMS),
});

async function listComparisonIds(userId: string): Promise<string[]> {
  const items = await db.userComparison.findMany({
    where: {
      userId,
      property: { listingStatus: "published" },
    },
    orderBy: { position: "asc" },
    select: { propertyId: true },
  });

  return items.map((item) => item.propertyId);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({
      comparison: await listComparisonIds(user.id),
    });
  } catch (error) {
    console.error("Failed to load comparison:", error);
    return NextResponse.json(
      { error: "Failed to load comparison" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const parsed = replaceSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid comparison list",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const ids = uniqueIds(
      parsed.data.ids,
      MAX_COMPARISON_ITEMS
    );
    const availableProperties = ids.length
      ? await db.property.findMany({
          where: {
            id: { in: ids },
            listingStatus: "published",
          },
          select: { id: true },
        })
      : [];
    const availableIds = new Set(
      availableProperties.map((property) => property.id)
    );

    if (availableIds.size !== ids.length) {
      return NextResponse.json(
        { error: "One or more properties are unavailable" },
        { status: 404 }
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.userComparison.deleteMany({
        where: { userId: user.id },
      });

      if (ids.length) {
        await transaction.userComparison.createMany({
          data: ids.map((propertyId, position) => ({
            userId: user.id,
            propertyId,
            position,
          })),
        });
      }
    });

    return NextResponse.json({ comparison: ids });
  } catch (error) {
    console.error("Failed to replace comparison:", error);
    return NextResponse.json(
      { error: "Failed to save comparison" },
      { status: 500 }
    );
  }
}