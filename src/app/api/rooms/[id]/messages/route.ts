import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rooms/[id]/messages — get messages for a room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const messages = await prisma.message.findMany({
      where: { roomId },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'asc' }
    });

    return NextResponse.json(messages);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/rooms/${roomId}/messages]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/rooms/[id]/messages — send a message
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const body = await request.json();
    const { senderId, content, messageType, attachmentUrl, attachmentName, mentions } = body;

    if (!senderId || !content) {
      return NextResponse.json({ error: 'senderId and content are required' }, { status: 400 });
    }

    const message = await prisma.message.create({
      data: {
        roomId,
        senderId,
        content,
        messageType: messageType || 'text',
        attachmentUrl: attachmentUrl || null,
        attachmentName: attachmentName || null,
        mentions: mentions ? JSON.stringify(mentions) : null
      },
      include: {
        sender: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        roomId,
        actorId: senderId,
        action: 'messageSent',
        targetType: 'Message',
        targetId: message.id,
        detail: JSON.stringify({ messageType: messageType || 'text' })
      }
    });

    // Notify other participants
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true }
    });

    if (room) {
      const { createNotification } = await import('@/lib/notification');
      for (const p of room.participants) {
        if (p.userId !== senderId) {
          await createNotification(
            p.userId,
            'NEW_MESSAGE',
            `New message from ${message.sender.name}`,
            `/rooms/${roomId}?tab=chat`
          );
        }
      }
    }

    return NextResponse.json(message, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/rooms/${roomId}/messages]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
