import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations/[id] - Get conversation with messages
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const conversation = await db.conversation.findUnique({
      where: { id },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
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
        },
      },
    });

    if (!conversation) {
      return NextResponse.json(
        { conversation: null, error: 'Conversation not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ conversation });
  } catch (error) {
    console.error('Error fetching conversation:', error);
    return NextResponse.json({ conversation: null, fallback: true });
  }
}
