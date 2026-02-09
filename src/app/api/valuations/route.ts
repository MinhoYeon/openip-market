import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/valuations — create a valuation request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requesterId, expertId, ipListingId, description, budget, requestType } = body;

    if (!requesterId || !ipListingId) {
      return NextResponse.json({ error: 'requesterId and ipListingId are required' }, { status: 400 });
    }

    const valuation = await prisma.valuationRequest.create({
      data: {
        requesterId,
        expertId: expertId || null,
        ipListingId,
        description,
        budget,
        requestType: requestType || (expertId ? 'DirectRequest' : 'OpenBid'),
        status: 'Open',
      },
      include: {
        expert: { select: { id: true, name: true } },
        ipListing: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json(valuation, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/valuations]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

// GET /api/valuations — get valuation requests (filtered by expert or requester)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expertId = searchParams.get('expertId');
    const requesterId = searchParams.get('requesterId');
    const status = searchParams.get('status');

    const where: any = {};
    if (expertId) where.OR = [{ expertId }, { requestType: 'OpenBid' }];
    if (requesterId) where.requesterId = requesterId;
    if (status) where.status = status;

    const valuations = await prisma.valuationRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true } },
        expert: { select: { id: true, name: true } },
        ipListing: { select: { id: true, title: true, ipType: true } },
        bids: {
          include: { expert: { select: { id: true, name: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(valuations);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/valuations]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
