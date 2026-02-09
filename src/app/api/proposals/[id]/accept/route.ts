import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/proposals/[id]/accept — accept proposal → auto-create Room
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;

  try {
    const body = await request.json();
    const { roomType } = body; // "Deal" or "License" — default to "Deal"

    // 1. Find and validate proposal
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
      include: {
        proposer: { select: { id: true, name: true, role: true } },
        demandRequest: {
          include: {
            requester: { select: { id: true, name: true, role: true } }
          }
        },
        ipListing: { select: { id: true, title: true, ipType: true, ownerId: true } }
      }
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (!['Submitted', 'Shortlisted'].includes(proposal.status)) {
      return NextResponse.json(
        { error: `Cannot accept proposal with status "${proposal.status}"` },
        { status: 400 }
      );
    }

    const type = roomType || 'Deal';
    const demand = proposal.demandRequest;
    const ipTitle = proposal.ipListing?.title || proposal.title;

    const roomData: any = {
      title: `${type}: ${ipTitle}`,
      type,
      participants: {
        create: [
          { userId: demand.requesterId, role: 'Buyer' },
          { userId: proposal.proposerId, role: proposal.proposer.role === 'Broker' ? 'BrokerSeller' : 'Seller' }
        ]
      }
    };

    if (proposal.ipListingId) {
      roomData.ipListing = { connect: { id: proposal.ipListingId } };
    }

    // 2. Create Room automatically
    const room = await prisma.room.create({
      data: roomData,
      include: {
        ipListing: { select: { id: true, title: true } },
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } }
        }
      }
    });

    // 3. Update proposal → Accepted
    await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'Accepted' }
    });

    // 4. Update demand → Matched
    await prisma.demandRequest.update({
      where: { id: demand.id },
      data: { status: 'Matched' }
    });

    // 5. If IP linked, update IP status
    if (proposal.ipListingId) {
      await prisma.iPListing.update({
        where: { id: proposal.ipListingId },
        data: { status: 'UnderNegotiation' }
      });
    }

    // 6. Create initial offer in the room from proposal terms
    if (proposal.proposedPrice) {
      await prisma.offer.create({
        data: {
          roomId: room.id,
          creatorId: proposal.proposerId,
          version: 1,
          price: proposal.proposedPrice,
          terms: JSON.stringify({
            source: 'proposal',
            proposalId: proposal.id,
            description: proposal.description
          }),
          message: `제안서에서 자동 생성된 오퍼`,
          status: 'Sent'
        }
      });
    }

    return NextResponse.json({
      room,
      proposal: { id: proposalId, status: 'Accepted' },
      demand: { id: demand.id, status: 'Matched' }
    }, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/proposals/${proposalId}/accept]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
