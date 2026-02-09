import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all demand requests
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ipType = searchParams.get('ipType');
    const status = searchParams.get('status');
    const urgency = searchParams.get('urgency');

    const where: any = {};
    if (ipType && ipType !== 'All') where.ipTypeNeeded = ipType;
    if (status) where.status = status;
    if (urgency) where.urgency = urgency;

    const demands = await prisma.demandRequest.findMany({
      where,
      include: {
        requester: { select: { id: true, name: true, role: true } },
        _count: { select: { proposals: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(demands);
  } catch (error: any) {
    console.error('API ERROR [GET /api/demands]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new demand request
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, ipTypeNeeded, industry, budgetRange, urgency, visibility, requesterId } = body;

    if (!title || !ipTypeNeeded || !requesterId) {
      return NextResponse.json(
        { error: 'title, ipTypeNeeded, and requesterId are required' },
        { status: 400 }
      );
    }

    const demand = await prisma.demandRequest.create({
      data: {
        title,
        description,
        ipTypeNeeded,
        industry,
        budgetRange,
        urgency: urgency || 'Normal',
        visibility: visibility || 'Public',
        requesterId
      },
      include: {
        requester: { select: { id: true, name: true, role: true } }
      }
    });

    return NextResponse.json(demand, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/demands]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
