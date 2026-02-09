import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// PATCH update offer status (Accept/Reject)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, roomId } = body;

    if (!status) {
      return NextResponse.json({ error: 'status is required' }, { status: 400 });
    }

    const offer = await prisma.offer.update({
      where: { id },
      data: { status },
      include: {
        room: {
          include: { participants: true }
        }
      }
    });

    // If Accepted, update Room status to 'Signing'
    if (status === 'Accepted' && offer.roomId) {
      await prisma.room.update({
        where: { id: offer.roomId },
        data: { status: 'Signing' }
      });

      // Update IP Listing status to 'UnderNegotiation'
      if (offer.room.ipListingId) {
        await prisma.iPListing.update({
          where: { id: offer.room.ipListingId },
          data: { status: 'UnderNegotiation' }
        });
      }
    }

    // Audit Log
    if (roomId) {
      await prisma.auditLog.create({
        data: {
          roomId,
          actorId: offer.creatorId, // This might need current user ID instead, but using creator for now or pass in actorId
          action: 'statusChanged',
          targetType: 'Offer',
          targetId: offer.id,
          detail: JSON.stringify({ oldStatus: 'Sent', newStatus: status })
        }
      });
    }

    return NextResponse.json(offer);
  } catch (error: any) {
    console.error(`API ERROR [PATCH /api/offers/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
