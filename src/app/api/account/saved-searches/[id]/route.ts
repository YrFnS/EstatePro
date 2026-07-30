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
import { normalizePropertyAlertFilters } from "@/lib/property-alerts";

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
      select: {
        id: true,
        filters: true,
        propertyAlert: {
          select: {
            id: true,
            currentMatchCount: true,
            lastRunAt: true,
            lastMatchedAt: true,
          },
        },
      },
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

    const name = parsed.data.name.trim();
    const filters = normalizeSavedSearchFilters(
      parsed.data.filters
    );
    if (!Object.keys(filters).length) {
      return NextResponse.json(
        { error: "At least one search filter is required" },
        { status: 400 }
      );
    }

    const alertFilters = normalizePropertyAlertFilters(filters);
    const previousAlertFilters = normalizePropertyAlertFilters(
      existing.filters
    );
    const filtersChanged =
      JSON.stringify(alertFilters) !==
      JSON.stringify(previousAlertFilters);
    const now = new Date();

    const operations: Prisma.PrismaPromise<unknown>[] = [
      db.savedSearch.update({
        where: { id },
        data: {
          name,
          filters: filters as Prisma.InputJsonValue,
          notificationsEnabled:
            parsed.data.notificationsEnabled,
          signature: hashSignature(name, filters),
        },
      }),
    ];

    if (parsed.data.notificationsEnabled) {
      if (existing.propertyAlert) {
        if (filtersChanged) {
          operations.push(
            db.propertyAlertMatch.deleteMany({
              where: {
                alertId: existing.propertyAlert.id,
              },
            })
          );
        }

        operations.push(
          db.propertyAlert.update({
            where: { id: existing.propertyAlert.id },
            data: {
              name,
              filters: alertFilters,
              enabled: true,
              nextRunAt: now,
              currentMatchCount: filtersChanged
                ? 0
                : existing.propertyAlert.currentMatchCount,
              lastRunAt: filtersChanged
                ? null
                : existing.propertyAlert.lastRunAt,
              lastMatchedAt: filtersChanged
                ? null
                : existing.propertyAlert.lastMatchedAt,
              lastError: null,
            },
          })
        );
      } else {
        operations.push(
          db.propertyAlert.create({
            data: {
              userId: user.id,
              savedSearchId: id,
              name,
              filters: alertFilters,
              signature: `saved-search:${id}`,
              frequency: "daily",
              enabled: true,
              nextRunAt: now,
            },
          })
        );
      }
    } else if (existing.propertyAlert) {
      operations.push(
        db.propertyAlert.delete({
          where: { id: existing.propertyAlert.id },
        })
      );
    }

    await db.$transaction(operations);

    const savedSearch = await db.savedSearch.findUnique({
      where: { id },
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
