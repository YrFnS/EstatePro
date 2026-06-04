import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// POST /api/conversations/[id]/messages - Send a message
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { senderId, content } = body;

    if (!senderId || !content) {
      return NextResponse.json(
        { message: null, error: 'senderId and content are required' },
        { status: 400 }
      );
    }

    // Verify conversation exists
    const conversation = await db.conversation.findUnique({
      where: { id },
    });

    if (!conversation) {
      return NextResponse.json(
        { message: null, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    // Create the message
    const message = await db.message.create({
      data: {
        conversationId: id,
        senderId,
        content,
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

    // Update conversation updatedAt
    await db.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ message: null, fallback: true });
  }
}

// PUT /api/conversations/[id]/messages - Mark messages as read
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { userId, messageIds } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    // Mark messages as read
    if (messageIds && Array.isArray(messageIds)) {
      await db.message.updateMany({
        where: {
          conversationId: id,
          id: { in: messageIds },
          senderId: { not: userId },
        },
        data: { read: true },
      });
    } else {
      // Mark all unread messages as read
      await db.message.updateMany({
        where: {
          conversationId: id,
          senderId: { not: userId },
          read: false,
        },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ success: false, fallback: true });
  }
}
