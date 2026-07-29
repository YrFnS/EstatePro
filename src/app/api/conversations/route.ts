import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser, isStaffRole } from "@/lib/api-auth";

const createConversationSchema = z.object({
  participantIds: z.array(z.string().trim().min(1)).min(1).max(8),
  propertyId: z.string().trim().min(1).nullable().optional(),
});

const participantUserSelect = {
  id: true,
  name: true,
  email: true,
  avatar: true,
  role: true,
} as const;

const conversationInclude = {
  participants: {
    include: { user: { select: participantUserSelect } },
  },
  messages: {
    orderBy: { createdAt: "desc" as const },
    take: 1,
  },
} as const;

export async function GET(_request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const rows = await db.conversation.findMany({
      where: { participants: { some: { userId: user.id } } },
      include: conversationInclude,
      orderBy: { updatedAt: "desc" },
    });

    const conversations = await Promise.all(
      rows.map(async (conversation) => {
        const unreadCount = await db.message.count({
          where: {
            conversationId: conversation.id,
            senderId: { not: user.id },
            read: false,
          },
        });

        const lastMessage = conversation.messages[0] || null;
        return {
          id: conversation.id,
          propertyId: conversation.propertyId,
          createdAt: conversation.createdAt,
          updatedAt: conversation.updatedAt,
          participants: conversation.participants,
          lastMessage,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const parsed = createConversationSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid conversation request" },
        { status: 400 }
      );
    }

    const propertyId = parsed.data.propertyId || null;
    const participantIds = Array.from(
      new Set([user.id, ...parsed.data.participantIds])
    );

    if (participantIds.length < 2) {
      return NextResponse.json(
        { error: "At least one other participant is required" },
        { status: 400 }
      );
    }

    const participantUsers = await db.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, role: true },
    });

    if (participantUsers.length !== participantIds.length) {
      return NextResponse.json(
        { error: "One or more participants do not exist" },
        { status: 400 }
      );
    }

    if (
      !isStaffRole(user.role) &&
      participantUsers.some(
        (participant) =>
          participant.id !== user.id && !isStaffRole(participant.role)
      )
    ) {
      return NextResponse.json(
        { error: "Customers can only start conversations with agents or administrators" },
        { status: 403 }
      );
    }

    if (propertyId) {
      const propertyExists = await db.property.count({ where: { id: propertyId } });
      if (!propertyExists) {
        return NextResponse.json({ error: "Property not found" }, { status: 404 });
      }
    }

    const candidates = await db.conversation.findMany({
      where: {
        propertyId,
        participants: { some: { userId: user.id } },
      },
      include: { participants: true },
    });

    const expectedIds = [...participantIds].sort();
    const existing = candidates.find((candidate) => {
      const actualIds = candidate.participants.map((row) => row.userId).sort();
      return (
        actualIds.length === expectedIds.length &&
        actualIds.every((id, index) => id === expectedIds[index])
      );
    });

    if (existing) {
      const conversation = await db.conversation.findUnique({
        where: { id: existing.id },
        include: conversationInclude,
      });
      return NextResponse.json({ conversation, existed: true });
    }

    const conversation = await db.conversation.create({
      data: {
        propertyId,
        participants: {
          create: participantIds.map((userId) => ({ userId })),
        },
      },
      include: conversationInclude,
    });

    return NextResponse.json(
      { conversation, existed: false },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating conversation:", error);
    return NextResponse.json(
      { error: "Failed to create conversation" },
      { status: 500 }
    );
  }
}
