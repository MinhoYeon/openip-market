
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: valuationId } = await params;
    const body = await request.json();
    const { bidId, requesterId } = body;

    // 1. Verify Valuation Request
    const valuation = await prisma.valuationRequest.findUnique({
      where: { id: valuationId },
      include: {
        ipListing: true,
        requester: true
      }
    });

    if (!valuation) {
      return NextResponse.json({ error: 'Valuation request not found' }, { status: 404 });
    }

    if (valuation.requesterId !== requesterId) {
      // In production, use session for this check
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // 2. Verify Bid
    const bid = await prisma.valuationBid.findUnique({
      where: { id: bidId },
      include: { expert: true }
    });

    if (!bid || bid.valuationRequestId !== valuationId) {
      return NextResponse.json({ error: 'Bid not found or mismatch' }, { status: 404 });
    }

    // 3. Update Statuses
    await prisma.$transaction([
      prisma.valuationBid.update({
        where: { id: bidId },
        data: { status: 'Accepted' }
      }),
      prisma.valuationRequest.update({
        where: { id: valuationId },
        data: {
          status: 'Processing',
          expertId: bid.expertId // Assign the expert
        }
      })
    ]);

    // 4. Create Valuation Room (Reusing Room model)
    const roomTitle = `[Valuation] ${valuation.ipListing.title} - ${bid.expert.name}`;

    // Create Room with Participants and Initial Agreed Offer
    const room = await prisma.room.create({
      data: {
        type: 'Valuation',
        status: 'Negotiating', // Start in Negotiating to show the Offer, or Signing if ready.
        title: roomTitle,
        ipListingId: valuation.ipListingId,
        participants: {
          create: [
            { userId: bid.expertId, role: 'Seller' }, // Expert sells service
            { userId: requesterId, role: 'Buyer' }   // Requester buys service
          ]
        },
        offers: {
          create: {
            creatorId: bid.expertId,
            price: bid.fee,
            status: 'Accepted', // Auto-accept the bid price
            version: 1,
            message: `Valuation Bid Accepted. Fee: ${bid.fee}, Lead Time: ${bid.leadTime}. ${bid.message || ''}`
          }
        }
      }
    });

    return NextResponse.json({ success: true, roomId: room.id });

  } catch (error: any) {
    console.error('Accept Bid Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
