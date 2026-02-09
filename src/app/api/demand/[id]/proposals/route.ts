import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notification';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: demandRequestId } = await params;
    // TODO: Verify user is the requester (or admin)

    const proposals = await prisma.proposal.findMany({
      where: { demandRequestId },
      include: {
        proposer: {
          select: { name: true, role: true, email: true }
        },
        ipListing: {
          select: { id: true, title: true, summary: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(proposals);
  } catch (error: any) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: demandRequestId } = await params;
    const body = await request.json();
    const {
      proposerId,
      title,
      description,
      proposedPrice,
      ipListingId
    } = body;

    if (!proposerId || !title) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const proposal = await prisma.proposal.create({
      data: {
        demandRequestId,
        proposerId,
        title,
        description,
        proposedPrice,
        ipListingId,
        status: 'Submitted'
      }
    });

    // Notify Requester
    const demand = await prisma.demandRequest.findUnique({ where: { id: demandRequestId } });
    if (demand) {
      await createNotification(
        demand.requesterId,
        'OFFER', // Using OFFER type for now, or SYSTEM
        `New proposal for your request: ${demand.title}`,
        `/demand/${demandRequestId}`
      );
    }

    return NextResponse.json(proposal);
  } catch (error: any) {
    console.error('API ERROR [POST Proposal]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
