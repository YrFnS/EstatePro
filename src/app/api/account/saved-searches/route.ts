import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import {
  MAX_SAVED_SEARCHES,
  normalizeSavedSearchFilters,
  savedSearchSignature,
} from "@/lib/account-state";
import { synchronizeSavedSearchPropertyAlerts } from "@/lib/property-alert-saved-search-sync";

const filterValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
]);

const searchInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  filters: z.record(z.string(), filterValueSchema),
  notificationsEnabled: z.boolean().optional().default(false),
});

const requestSchema = z
  .object({
    search: searchInputSchema.optional(),
    searches: z
      .array(searchInputSchema)
      .max(MAX_SAVED_SEARCHES)
      .optional(),
  })
  .refine(
    (value) => Boolean(value.search || value.searches?.length),
    { message: "A search or searches array is required" }
  );

function hashSignature(
  name: string,
  filters: Record<string, string>
): string {
  return createHash("sha256")
    .update(savedSearchSignature(name, filters))
    .digest("hex");
}

async function listSavedSearches(userId: string) {
  return db.savedSearch.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_SAVED_SEARCHES,
    select: {
      id: true,
      name: true,
      filters: true,
      notificationsEnabled: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    await synchronizeSavedSearchPropertyAlerts({
      userId: user.id,
    });

    return NextResponse.json({
      savedSearches: await listSavedSearches(user.id),
    });
  } catch (error) {
    console.error("Failed to load saved searches:", error);
    return NextResponse.json(
      { error: "Failed to load saved searches" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid saved search",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const incoming = [
      ...(parsed.data.search ? [parsed.data.search] : []),
      ...(parsed.data.searches || []),
    ]
      .map((item) => {
        const filters = normalizeSavedSearchFilters(item.filters);
        return {
          name: item.name.trim(),
          filters,
          notificationsEnabled: item.notificationsEnabled,
          signature: hashSignature(item.name, filters),
        };
      })
      .filter((item) => Object.keys(item.filters).length > 0);

    if (!incoming.length) {
      return NextResponse.json(
        { error: "At least one search filter is required" },
        { status: 400 }
      );
    }

    const [currentCount, existing] = await Promise.all([
      db.savedSearch.count({
        where: { userId: user.id },
      }),
      db.savedSearch.findMany({
        where: {
          userId: user.id,
          signature: {
            in: incoming.map((item) => item.signature),
          },
        },
        select: { signature: true },
      }),
    ]);

    const existingSignatures = new Set(
      existing.map((item) => item.signature)
    );
    const newItems = incoming.filter(
      (item) => !existingSignatures.has(item.signature)
    );

    if (
      currentCount + newItems.length >
      MAX_SAVED_SEARCHES
    ) {
      return NextResponse.json(
        {
          error: `You can save up to ${MAX_SAVED_SEARCHES} searches`,
        },
        { status: 409 }
      );
    }

    if (newItems.length) {
      await db.savedSearch.createMany({
        data: newItems.map((item) => ({
          userId: user.id,
          name: item.name,
          filters: item.filters as Prisma.InputJsonValue,
          notificationsEnabled: item.notificationsEnabled,
          signature: item.signature,
        })),
        skipDuplicates: true,
      });
    }

    await synchronizeSavedSearchPropertyAlerts({
      userId: user.id,
    });

    const savedSearches = await listSavedSearches(user.id);
    const singleSignature = parsed.data.search
      ? incoming[0]?.signature || null
      : null;

    return NextResponse.json(
      {
        savedSearch:
          singleSignature
            ? await db.savedSearch.findUnique({
                where: {
                  userId_signature: {
                    userId: user.id,
                    signature: singleSignature,
                  },
                },
                select: {
                  id: true,
                  name: true,
                  filters: true,
                  notificationsEnabled: true,
                  createdAt: true,
                  updatedAt: true,
                },
              })
            : null,
        savedSearches,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to save search:", error);
    return NextResponse.json(
      { error: "Failed to save search" },
      { status: 500 }
    );
  }
}
