import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/valuations/[id]/bids — expert submitting a bid
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: valuationRequestId } = await params;

  try {
    const body = await request.json();
    const { expertId, fee, leadTime, message } = body;

    if (!expertId || !fee || !leadTime) {
      return NextResponse.json({ error: 'expertId, fee, and leadTime are required' }, { status: 400 });
    }

    const bid = await prisma.valuationBid.create({
      data: {
        valuationRequestId,
        expertId,
        fee,
        leadTime,
        message,
        status: 'Submitted'
      },
      include: {
        expert: { select: { id: true, name: true } }
      }
    });

    // Notify Requester
    const valuationReq = await prisma.valuationRequest.findUnique({
      where: { id: valuationRequestId },
      select: { requesterId: true, ipListing: { select: { title: true } } }
    });

    if (valuationReq) {
      await prisma.notification.create({
        data: {
          userId: valuationReq.requesterId,
          type: 'BID_RECEIVED',
          content: `New bid received for "${valuationReq.ipListing.title}": ${Number(fee).toLocaleString()} KRW`,
          link: '/valuation/my-requests'
        }
      });
    }

    return NextResponse.json(bid, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/valuations/${valuationRequestId}/bids]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// GET /api/valuations/[id]/bids — get bids for a request
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: valuationRequestId } = await params;

  try {
    const bids = await prisma.valuationBid.findMany({
      where: { valuationRequestId },
      include: {
        expert: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(bids);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/valuations/${valuationRequestId}/bids]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
