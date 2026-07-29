import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import {
  MAX_FAVORITES,
  uniqueIds,
} from "@/lib/account-state";

const replaceSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(200)).max(MAX_FAVORITES),
});

async function listFavoriteIds(userId: string): Promise<string[]> {
  const favorites = await db.userFavorite.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { propertyId: true },
  });

  return favorites.map((item) => item.propertyId);
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({
      favorites: await listFavoriteIds(user.id),
    });
  } catch (error) {
    console.error("Failed to load favorites:", error);
    return NextResponse.json(
      { error: "Failed to load favorites" },
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
          error: "Invalid favorites",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const ids = uniqueIds(parsed.data.ids, MAX_FAVORITES);
    const existingProperties = ids.length
      ? await db.property.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        })
      : [];
    const existingIds = new Set(
      existingProperties.map((property) => property.id)
    );

    if (existingIds.size !== ids.length) {
      return NextResponse.json(
        { error: "One or more properties no longer exist" },
        { status: 404 }
      );
    }

    await db.$transaction(async (transaction) => {
      await transaction.userFavorite.deleteMany({
        where: { userId: user.id },
      });

      if (ids.length) {
        await transaction.userFavorite.createMany({
          data: ids.map((propertyId, index) => ({
            userId: user.id,
            propertyId,
            createdAt: new Date(Date.now() - index),
          })),
        });
      }
    });

    return NextResponse.json({ favorites: ids });
  } catch (error) {
    console.error("Failed to replace favorites:", error);
    return NextResponse.json(
      { error: "Failed to save favorites" },
      { status: 500 }
    );
  }
}
