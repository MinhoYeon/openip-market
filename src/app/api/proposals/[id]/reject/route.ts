import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/proposals/[id]/reject — reject a proposal
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: proposalId } = await params;

  try {
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId }
    });

    if (!proposal) {
      return NextResponse.json({ error: 'Proposal not found' }, { status: 404 });
    }

    if (['Accepted', 'Rejected', 'Withdrawn'].includes(proposal.status)) {
      return NextResponse.json(
        { error: `Cannot reject proposal with status "${proposal.status}"` },
        { status: 400 }
      );
    }

    const updated = await prisma.proposal.update({
      where: { id: proposalId },
      data: { status: 'Rejected' },
      include: {
        proposer: { select: { id: true, name: true, role: true } }
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error(`API ERROR [POST /api/proposals/${proposalId}/reject]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
