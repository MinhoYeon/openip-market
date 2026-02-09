import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET proposals for a demand
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: demandId } = await params;

  try {
    const proposals = await prisma.proposal.findMany({
      where: { demandRequestId: demandId },
      include: {
        proposer: { select: { id: true, name: true, role: true } },
        ipListing: { select: { id: true, title: true, ipType: true, priceExpectation: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(proposals);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/demands/${demandId}/proposals]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST submit a proposal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: demandId } = await params;

  try {
    const body = await request.json();
    const { proposerId, ipListingId, title, description, proposedPrice } = body;

    if (!proposerId || !title) {
      return NextResponse.json(
        { error: 'proposerId and title are required' },
        { status: 400 }
      );
    }

    const proposal = await prisma.proposal.create({
      data: {
        demandRequestId: demandId,
        proposerId,
        ipListingId: ipListingId || null,
        title,
        description,
        proposedPrice,
        status: 'Submitted'
      },
      include: {
        proposer: { select: { id: true, name: true, role: true } },
        ipListing: { select: { id: true, title: true, ipType: true } }
      }
    });

    // Update demand status to InReview if it was Open
    const demand = await prisma.demandRequest.findUnique({ where: { id: demandId } });
    if (demand?.status === 'Open') {
      await prisma.demandRequest.update({
        where: { id: demandId },
        data: { status: 'InReview' }
      });
    }

    return NextResponse.json(proposal, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/demands/${demandId}/proposals]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
