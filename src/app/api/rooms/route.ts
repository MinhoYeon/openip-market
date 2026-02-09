import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all rooms (for current user - simplified for demo)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // Deal, License, Valuation
    const status = searchParams.get('status');

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;

    const rooms = await prisma.room.findMany({
      where,
      include: {
        ipListing: {
          select: { id: true, title: true, ipType: true }
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, role: true } }
          }
        },
        _count: {
          select: { offers: true, documents: true }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    return NextResponse.json(rooms);
  } catch (error: any) {
    console.error('API ERROR [GET /api/rooms]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new room
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, type, ipListingId, participants } = body;

    if (!title || !type || !ipListingId) {
      return NextResponse.json(
        { error: 'title, type, and ipListingId are required' },
        { status: 400 }
      );
    }

    // Create room with participants
    const room = await prisma.room.create({
      data: {
        title,
        type, // Deal, License, Valuation
        ipListingId,
        participants: participants?.length > 0 ? {
          create: participants.map((p: { userId: string; role: string }) => ({
            userId: p.userId,
            role: p.role
          }))
        } : undefined
      },
      include: {
        ipListing: { select: { id: true, title: true } },
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } }
        }
      }
    });

    // Update IP listing status to UnderNegotiation
    await prisma.iPListing.update({
      where: { id: ipListingId },
      data: { status: 'UnderNegotiation' }
    });

    return NextResponse.json(room, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/rooms]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
