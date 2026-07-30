import { createHash } from "node:crypto";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { savedSearchSignature } from "@/lib/account-state";
import {
  forbidden,
  getCurrentUser,
  unauthorized,
} from "@/lib/api-auth";
import {
  propertyAlertInclude,
  serializePropertyAlert,
} from "@/lib/property-alert-records";
import {
  normalizePropertyAlertFilters,
  normalizePropertyAlertFrequency,
  propertyAlertSignature,
} from "@/lib/property-alerts";

const updateSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    filters: z.record(z.string(), z.unknown()).optional(),
    frequency: z.enum(["instant", "daily", "weekly"]).optional(),
    enabled: z.boolean().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.propertyAlert.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Property alert not found" },
      { status: 404 }
    );
  }
  if (existing.userId !== user.id) return forbidden();

  try {
    const parsed = updateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid property alert",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const name = parsed.data.name ?? existing.name;
    const frequency = normalizePropertyAlertFrequency(
      parsed.data.frequency ?? existing.frequency
    );
    const filters =
      parsed.data.filters === undefined
        ? normalizePropertyAlertFilters(existing.filters)
        : normalizePropertyAlertFilters(parsed.data.filters);
    const enabled = parsed.data.enabled ?? existing.enabled;

    if (!Object.keys(filters).length) {
      return NextResponse.json(
        { error: "Choose at least one alert criterion" },
        { status: 400 }
      );
    }

    const previousFilters = normalizePropertyAlertFilters(
      existing.filters
    );
    const filtersChanged =
      JSON.stringify(previousFilters) !== JSON.stringify(filters);
    const enabledChanged = enabled !== existing.enabled;
    const signature = existing.savedSearchId
      ? existing.signature
      : propertyAlertSignature(name, filters, frequency);
    const now = new Date();

    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (filtersChanged) {
      operations.push(
        db.propertyAlertMatch.deleteMany({
          where: { alertId: existing.id },
        })
      );
    }

    if (existing.savedSearchId) {
      operations.push(
        db.savedSearch.update({
          where: { id: existing.savedSearchId },
          data: {
            name,
            filters,
            notificationsEnabled: enabled,
            signature: createHash("sha256")
              .update(savedSearchSignature(name, filters))
              .digest("hex"),
          },
        })
      );
    }

    operations.push(
      db.propertyAlert.update({
        where: { id: existing.id },
        data: {
          name,
          filters,
          signature,
          frequency,
          enabled,
          nextRunAt: !enabled
            ? null
            : filtersChanged || enabledChanged
              ? now
              : existing.nextRunAt,
          currentMatchCount: filtersChanged
            ? 0
            : existing.currentMatchCount,
          lastRunAt: filtersChanged ? null : existing.lastRunAt,
          lastMatchedAt: filtersChanged
            ? null
            : existing.lastMatchedAt,
          lastError: null,
        },
      })
    );

    await db.$transaction(operations);

    const updated = await db.propertyAlert.findUnique({
      where: { id: existing.id },
      include: propertyAlertInclude,
    });

    if (!updated) {
      return NextResponse.json(
        { error: "Property alert not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      alert: serializePropertyAlert(updated),
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "An alert with these criteria already exists" },
        { status: 409 }
      );
    }

    console.error("Failed to update property alert:", error);
    return NextResponse.json(
      { error: "Failed to update property alert" },
      { status: 500 }
    );
  }
}

export const PUT = PATCH;

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  const { id } = await params;
  const existing = await db.propertyAlert.findUnique({
    where: { id },
    select: { id: true, userId: true, savedSearchId: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Property alert not found" },
      { status: 404 }
    );
  }
  if (existing.userId !== user.id) return forbidden();

  try {
    const operations: Prisma.PrismaPromise<unknown>[] = [];

    if (existing.savedSearchId) {
      operations.push(
        db.savedSearch.update({
          where: { id: existing.savedSearchId },
          data: { notificationsEnabled: false },
        })
      );
    }

    operations.push(
      db.propertyAlert.delete({ where: { id } })
    );

    await db.$transaction(operations);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete property alert:", error);
    return NextResponse.json(
      { error: "Failed to delete property alert" },
      { status: 500 }
    );
  }
}
