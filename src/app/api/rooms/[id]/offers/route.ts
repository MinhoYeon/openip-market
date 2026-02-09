import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET offers for a room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const offers = await prisma.offer.findMany({
      where: { roomId },
      include: {
        createdBy: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(offers);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/rooms/${roomId}/offers]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new offer
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const body = await request.json();
    const { creatorId, price, terms, message, status } = body;

    if (!creatorId) {
      return NextResponse.json({ error: 'creatorId is required' }, { status: 400 });
    }

    // Get highest version for this room
    const latestOffer = await prisma.offer.findFirst({
      where: { roomId },
      orderBy: { version: 'desc' }
    });

    const offer = await prisma.offer.create({
      data: {
        roomId,
        creatorId,
        version: (latestOffer?.version || 0) + 1,
        price,
        terms: typeof terms === 'object' ? JSON.stringify(terms) : terms,
        message,
        status: status || 'Sent'
      },
      include: {
        createdBy: { select: { id: true, name: true, role: true } }
      }
    });

    // Update room status to Negotiating if it was Setup
    // Update room status to Negotiating if it was Setup
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { participants: true }
    });

    if (room) {
      if (room.status === 'Setup') {
        await prisma.room.update({
          where: { id: roomId },
          data: { status: 'Negotiating' }
        });
      }

      // Notify other participants
      const { createNotification } = await import('@/lib/notification');
      for (const p of room.participants) {
        if (p.userId !== creatorId) {
          await createNotification(
            p.userId,
            'OFFER',
            `New offer received in Room #${roomId}`,
            `/rooms/${roomId}?tab=negotiation`
          );
        }
      }
    }

    return NextResponse.json(offer, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/rooms/${roomId}/offers]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
