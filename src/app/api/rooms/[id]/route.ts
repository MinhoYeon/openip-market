import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single room with full details
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const room = await prisma.room.findUnique({
      where: { id },
      include: {
        ipListing: {
          select: {
            id: true, title: true, ipType: true, industry: true,
            priceExpectation: true, visibility: true, status: true,
            owner: { select: { id: true, name: true, role: true } }
          }
        },
        participants: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } }
          }
        },
        offers: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: { select: { id: true, name: true, role: true } }
          }
        },
        documents: {
          orderBy: { createdAt: 'desc' },
          include: {
            uploadedBy: { select: { id: true, name: true } },
            signatureRequests: { select: { id: true, signerId: true, status: true } }
          }
        },
        settlements: {
          orderBy: { createdAt: 'desc' },
          include: { payer: true, payee: true }
        }
      }
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json(room);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/rooms/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update room status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, title } = body;

    const data: any = {};
    if (status) data.status = status;
    if (title) data.title = title;

    const room = await prisma.room.update({
      where: { id },
      data,
      include: {
        ipListing: { select: { id: true, title: true } },
        participants: {
          include: { user: { select: { id: true, name: true } } }
        }
      }
    });

    // If room completed/terminated, update IP listing status (if linked)
    if (room.ipListingId) {
      if (status === 'Completed') {
        await prisma.iPListing.update({
          where: { id: room.ipListingId },
          data: { status: 'Sold' }
        });
      } else if (status === 'Terminated') {
        await prisma.iPListing.update({
          where: { id: room.ipListingId },
          data: { status: 'Published' }
        });
      }
    }

    return NextResponse.json(room);
  } catch (error: any) {
    console.error(`API ERROR [PUT /api/rooms/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
