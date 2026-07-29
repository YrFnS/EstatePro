import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import {
  normalizeSavedSearchFilters,
  savedSearchSignature,
} from "@/lib/account-state";

const filterValueSchema = z.union([
  z.string().max(500),
  z.number().finite(),
  z.boolean(),
]);

const updateSchema = z.object({
  name: z.string().trim().min(1).max(120),
  filters: z.record(z.string(), filterValueSchema),
  notificationsEnabled: z.boolean().optional().default(false),
});

function hashSignature(
  name: string,
  filters: Record<string, string>
): string {
  return createHash("sha256")
    .update(savedSearchSignature(name, filters))
    .digest("hex");
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const existing = await db.savedSearch.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Saved search not found" },
        { status: 404 }
      );
    }

    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid saved search",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const filters = normalizeSavedSearchFilters(
      parsed.data.filters
    );
    if (!Object.keys(filters).length) {
      return NextResponse.json(
        { error: "At least one search filter is required" },
        { status: 400 }
      );
    }

    const savedSearch = await db.savedSearch.update({
      where: { id },
      data: {
        name: parsed.data.name.trim(),
        filters: filters as Prisma.InputJsonValue,
        notificationsEnabled:
          parsed.data.notificationsEnabled,
        signature: hashSignature(
          parsed.data.name,
          filters
        ),
      },
      select: {
        id: true,
        name: true,
        filters: true,
        notificationsEnabled: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ savedSearch });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An identical saved search already exists" },
        { status: 409 }
      );
    }

    console.error("Failed to update saved search:", error);
    return NextResponse.json(
      { error: "Failed to update saved search" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const { id } = await params;
    const result = await db.savedSearch.deleteMany({
      where: { id, userId: user.id },
    });

    if (!result.count) {
      return NextResponse.json(
        { error: "Saved search not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete saved search:", error);
    return NextResponse.json(
      { error: "Failed to delete saved search" },
      { status: 500 }
    );
  }
}
