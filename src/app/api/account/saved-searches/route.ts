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
      .map((item) => ({
        name: item.name.trim(),
        filters: normalizeSavedSearchFilters(item.filters),
        notificationsEnabled: item.notificationsEnabled,
      }))
      .filter((item) => Object.keys(item.filters).length > 0);

    if (!incoming.length) {
      return NextResponse.json(
        { error: "At least one search filter is required" },
        { status: 400 }
      );
    }

    const currentCount = await db.savedSearch.count({
      where: { userId: user.id },
    });
    const availableSlots = Math.max(
      0,
      MAX_SAVED_SEARCHES - currentCount
    );

    if (!availableSlots) {
      return NextResponse.json(
        {
          error: `You can save up to ${MAX_SAVED_SEARCHES} searches`,
        },
        { status: 409 }
      );
    }

    const candidates = incoming.slice(0, availableSlots);

    await db.savedSearch.createMany({
      data: candidates.map((item) => ({
        userId: user.id,
        name: item.name,
        filters: item.filters as Prisma.InputJsonValue,
        notificationsEnabled: item.notificationsEnabled,
        signature: hashSignature(item.name, item.filters),
      })),
      skipDuplicates: true,
    });

    const savedSearches = await listSavedSearches(user.id);
    const singleSignature = parsed.data.search
      ? hashSignature(
          candidates[0]?.name || "",
          candidates[0]?.filters || {}
        )
      : null;

    return NextResponse.json(
      {
        savedSearch:
          singleSignature &&
          candidates[0]
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
