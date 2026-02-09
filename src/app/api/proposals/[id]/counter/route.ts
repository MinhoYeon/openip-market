import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/proposals/[id]/counter — counter a proposal with new terms
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;

  try {
    const body = await request.json();
    const { counterPrice, counterTerms, message } = body;

    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (!['Submitted', 'Shortlisted'].includes(proposal.status)) {
      return NextResponse.json(
        { error: `Cannot counter proposal with status "${proposal.status}"` },
        { status: 400 }
      );
    }

    // Update original proposal status
    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: {
        status: 'UnderReview',
        description: proposal.description
          ? `${proposal.description}\n\n--- Counter ---\nPrice: ${counterPrice || 'N/A'}\nTerms: ${counterTerms || 'N/A'}\nMessage: ${message || 'N/A'}`
          : `Counter: Price ${counterPrice}, Terms: ${counterTerms}, Message: ${message}`
      },
      include: {
        proposer: { select: { id: true, name: true, role: true } },
        ipListing: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`API ERROR [POST /api/proposals/${proposalId}/counter]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
