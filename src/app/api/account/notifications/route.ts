import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, unauthorized } from "@/lib/api-auth";
import {
  MAX_NOTIFICATIONS,
  notificationTimestamp,
} from "@/lib/account-state";

const notificationInputSchema = z.object({
  sourceId: z.string().trim().min(1).max(200).optional(),
  type: z.enum([
    "property",
    "price",
    "search",
    "system",
    "inquiry",
  ]),
  title: z.string().trim().min(1).max(160),
  message: z.string().trim().min(1).max(2_000),
  actionUrl: z.string().trim().max(500).optional(),
  timestamp: z.number().finite().positive().optional(),
  read: z.boolean().optional().default(false),
});

const createSchema = z
  .object({
    notification: notificationInputSchema.optional(),
    notifications: z
      .array(notificationInputSchema)
      .max(50)
      .optional(),
  })
  .refine(
    (value) =>
      Boolean(value.notification || value.notifications?.length),
    {
      message:
        "A notification or notifications array is required",
    }
  );

async function listNotifications(userId: string) {
  const notifications = await db.userNotification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: MAX_NOTIFICATIONS,
    select: {
      id: true,
      sourceId: true,
      type: true,
      title: true,
      message: true,
      actionUrl: true,
      read: true,
      createdAt: true,
    },
  });

  return notifications.map((item) => ({
    id: item.id,
    sourceId: item.sourceId || undefined,
    type: item.type,
    title: item.title,
    message: item.message,
    actionUrl: item.actionUrl || undefined,
    read: item.read,
    timestamp: item.createdAt.getTime(),
  }));
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    return NextResponse.json({
      notifications: await listNotifications(user.id),
    });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json(
      { error: "Failed to load notifications" },
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
          error: "Invalid notification",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const incoming = [
      ...(parsed.data.notification
        ? [parsed.data.notification]
        : []),
      ...(parsed.data.notifications || []),
    ];

    await db.userNotification.createMany({
      data: incoming.map((item) => ({
        userId: user.id,
        sourceId: item.sourceId || null,
        type: item.type,
        title: item.title,
        message: item.message,
        actionUrl: item.actionUrl || null,
        read: item.read,
        createdAt: new Date(
          notificationTimestamp(item.timestamp)
        ),
      })),
      skipDuplicates: true,
    });

    const total = await db.userNotification.count({
      where: { userId: user.id },
    });

    if (total > MAX_NOTIFICATIONS) {
      const stale = await db.userNotification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: MAX_NOTIFICATIONS,
        select: { id: true },
      });

      if (stale.length) {
        await db.userNotification.deleteMany({
          where: {
            userId: user.id,
            id: { in: stale.map((item) => item.id) },
          },
        });
      }
    }

    return NextResponse.json(
      {
        notifications: await listNotifications(user.id),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create notification:", error);
    return NextResponse.json(
      { error: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function PATCH() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    await db.userNotification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to mark notifications read:", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return unauthorized();

  try {
    await db.userNotification.deleteMany({
      where: { userId: user.id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to clear notifications:", error);
    return NextResponse.json(
      { error: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
