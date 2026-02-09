import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET valuation requests for an expert
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: expertId } = await params;

  // Find user by expert profile id
  const expertProfile = await prisma.expertProfile.findUnique({ where: { id: expertId } });
  if (!expertProfile) {
    return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
  }

  try {
    const requests = await prisma.valuationRequest.findMany({
      where: { expertId: expertProfile.userId },
      include: {
        requester: { select: { id: true, name: true } },
        ipListing: { select: { id: true, title: true, ipType: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(requests);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/experts/${expertId}/requests]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a valuation request for this expert
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: expertId } = await params;

  try {
    const body = await request.json();
    const { requesterId, ipListingId, description, budget, urgency } = body;

    if (!requesterId || !ipListingId) {
      return NextResponse.json({ error: 'requesterId and ipListingId are required' }, { status: 400 });
    }

    // Find the user linked to this expert profile
    const expertProfile = await prisma.expertProfile.findUnique({ where: { id: expertId } });
    if (!expertProfile) {
      return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    }

    const valRequest = await prisma.valuationRequest.create({
      data: {
        requesterId,
        expertId: expertProfile.userId,
        ipListingId,
        requestType: 'DirectRequest',
        description,
        budget,
        urgency: urgency || 'Normal',
        status: 'Assigned'
      },
      include: {
        requester: { select: { id: true, name: true } },
        expert: { select: { id: true, name: true } },
        ipListing: { select: { id: true, title: true } }
      }
    });

    return NextResponse.json(valRequest, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/experts/${expertId}/requests]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
