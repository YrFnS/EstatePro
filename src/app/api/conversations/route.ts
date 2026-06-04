import { db } from '@/lib/db';
import { NextRequest, NextResponse } from 'next/server';

// GET /api/conversations?userId=xxx
export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { conversations: [], fallback: true, error: 'userId is required' },
        { status: 400 }
      );
    }

    const participants = await db.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
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
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
      orderBy: { conversation: { updatedAt: 'desc' } },
    });

    // Count unread messages for each conversation
    const conversations = await Promise.all(
      participants.map(async (p) => {
        const unreadCount = await db.message.count({
          where: {
            conversationId: p.conversationId,
            senderId: { not: userId },
            read: false,
          },
        });

        const lastMessage = p.conversation.messages[0] || null;

        return {
          id: p.conversation.id,
          propertyId: p.conversation.propertyId,
          createdAt: p.conversation.createdAt,
          updatedAt: p.conversation.updatedAt,
          participants: p.conversation.participants.map((cp) => ({
            id: cp.id,
            userId: cp.userId,
            joinedAt: cp.joinedAt,
            user: cp.user,
          })),
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                senderId: lastMessage.senderId,
                content: lastMessage.content,
                createdAt: lastMessage.createdAt,
                read: lastMessage.read,
              }
            : null,
          unreadCount,
        };
      })
    );

    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ conversations: [], fallback: true });
  }
}

// POST /api/conversations - Create new conversation
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { participantIds, propertyId } = body;

    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
      return NextResponse.json(
        { conversation: null, error: 'At least 2 participant IDs are required' },
        { status: 400 }
      );
    }

    // Check if a conversation already exists between these participants (and optionally property)
    const existingParticipant = await db.conversationParticipant.findFirst({
      where: { userId: participantIds[0] },
      include: {
        conversation: {
          include: {
            participants: true,
          },
        },
      },
    });

    // Look for an existing conversation with the same participants
    let existingConversation = null;
    if (existingParticipant) {
      const userConversations = await db.conversationParticipant.findMany({
        where: { userId: participantIds[0] },
        include: {
          conversation: {
            include: {
              participants: true,
            },
          },
        },
      });

      for (const uc of userConversations) {
        const conv = uc.conversation;
        const convParticipantIds = conv.participants.map((p) => p.userId).sort();
        const sortedInputIds = [...participantIds].sort();

        if (
          convParticipantIds.length === sortedInputIds.length &&
          convParticipantIds.every((id, idx) => id === sortedInputIds[idx]) &&
          (!propertyId || conv.propertyId === propertyId)
        ) {
          existingConversation = conv;
          break;
        }
      }
    }

    if (existingConversation) {
      // Return existing conversation with full details
      const fullConversation = await db.conversation.findUnique({
        where: { id: existingConversation.id },
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
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      return NextResponse.json({ conversation: fullConversation, existed: true });
    }

    // Create new conversation
    const conversation = await db.conversation.create({
      data: {
        propertyId: propertyId || null,
        participants: {
          create: participantIds.map((userId: string) => ({
            userId,
          })),
        },
      },
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
        messages: true,
      },
    });

    return NextResponse.json({ conversation, existed: false });
  } catch (error) {
    console.error('Error creating conversation:', error);
    return NextResponse.json({ conversation: null, fallback: true });
  }
}
