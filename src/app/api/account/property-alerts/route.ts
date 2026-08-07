import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import { listPropertyAlerts } from "@/lib/property-alert-records";
import {
  hasInvalidPropertyAlertRange,
  MAX_PROPERTY_ALERTS,
  normalizePropertyAlertFilters,
  normalizePropertyAlertFrequency,
  propertyAlertSignature,
} from "@/lib/property-alerts";

const alertInputSchema = z.object({
  name: z.string().trim().min(1).max(120),
  filters: z.record(z.string(), z.unknown()),
  frequency: z
    .enum(["instant", "daily", "weekly"])
    .optional()
    .default("daily"),
  enabled: z.boolean().optional().default(true),
});

const createSchema = z
  .object({
    alert: alertInputSchema.optional(),
    alerts: z.array(alertInputSchema).max(MAX_PROPERTY_ALERTS).optional(),
  })
  .refine(
    (value) => Boolean(value.alert || value.alerts?.length),
    {
      message: "An alert or alerts array is required",
    }
  );

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({
      alerts: await listPropertyAlerts(user.id),
    });
  } catch (error) {
    console.error("Failed to load property alerts:", error);
    return NextResponse.json(
      { error: "Failed to load property alerts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid property alert",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const incoming = [
      ...(parsed.data.alert ? [parsed.data.alert] : []),
      ...(parsed.data.alerts || []),
    ]
      .map((item) => {
        const filters = normalizePropertyAlertFilters(item.filters);
        const frequency = normalizePropertyAlertFrequency(
          item.frequency
        );
        return {
          name: item.name.trim(),
          filters,
          frequency,
          enabled: item.enabled,
          signature: propertyAlertSignature(
            item.name,
            filters,
            frequency
          ),
        };
      })
      .filter((item) => Object.keys(item.filters).length > 0);

    if (!incoming.length) {
      return NextResponse.json(
        { error: "Choose at least one alert criterion" },
        { status: 400 }
      );
    }
    if (incoming.some((item) => hasInvalidPropertyAlertRange(item.filters))) {
      return NextResponse.json(
        { error: "Minimum values cannot exceed maximum values" },
        { status: 400 }
      );
    }

    const existingCount = await db.propertyAlert.count({
      where: { userId: user.id },
    });
    const available = Math.max(
      0,
      MAX_PROPERTY_ALERTS - existingCount
    );

    const existingSignatures = await db.propertyAlert.findMany({
      where: {
        userId: user.id,
        signature: {
          in: incoming.map((item) => item.signature),
        },
      },
      select: { signature: true },
    });
    const known = new Set(
      existingSignatures.map((item) => item.signature)
    );
    const newItems = incoming.filter(
      (item) => !known.has(item.signature)
    );

    if (newItems.length > available) {
      return NextResponse.json(
        {
          error: `You can save up to ${MAX_PROPERTY_ALERTS} property alerts`,
        },
        { status: 409 }
      );
    }

    const now = new Date();

    await db.$transaction(
      incoming.map((item) =>
        db.propertyAlert.upsert({
          where: {
            userId_signature: {
              userId: user.id,
              signature: item.signature,
            },
          },
          update: {
            name: item.name,
            filters: item.filters,
            frequency: item.frequency,
            enabled: item.enabled,
            nextRunAt: item.enabled ? now : null,
            lastError: null,
          },
          create: {
            userId: user.id,
            name: item.name,
            filters: item.filters,
            signature: item.signature,
            frequency: item.frequency,
            enabled: item.enabled,
            nextRunAt: item.enabled ? now : null,
          },
        })
      )
    );

    return NextResponse.json(
      {
        alerts: await listPropertyAlerts(user.id),
      },
      { status: 201 }
    );
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

    console.error("Failed to create property alert:", error);
    return NextResponse.json(
      { error: "Failed to create property alert" },
      { status: 500 }
    );
  }
}
