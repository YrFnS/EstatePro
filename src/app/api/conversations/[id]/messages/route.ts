import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/api-auth";

const sendMessageSchema = z.object({
  content: z.string().trim().min(1).max(4_000),
});

const markReadSchema = z.object({
  messageIds: z.array(z.string().trim().min(1)).max(500).optional(),
});

async function isConversationMember(conversationId: string, userId: string) {
  const membership = await db.conversationParticipant.findUnique({
    where: {
      conversationId_userId: { conversationId, userId },
    },
    select: { id: true },
  });
  return Boolean(membership);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!(await isConversationMember(id, user.id))) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const parsed = sendMessageSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Message content is required and must be under 4,000 characters" },
        { status: 400 }
      );
    }

    const message = await db.message.create({
      data: {
        conversationId: id,
        senderId: user.id,
        content: parsed.data.content,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    await db.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message }, { status: 201 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  try {
    const { id } = await params;
    if (!(await isConversationMember(id, user.id))) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      );
    }

    const parsed = markReadSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid message IDs" }, { status: 400 });
    }

    await db.message.updateMany({
      where: {
        conversationId: id,
        senderId: { not: user.id },
        read: false,
        ...(parsed.data.messageIds
          ? { id: { in: parsed.data.messageIds } }
          : {}),
      },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error marking messages as read:", error);
    return NextResponse.json(
      { error: "Failed to mark messages as read" },
      { status: 500 }
    );
  }
}
