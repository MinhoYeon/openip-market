import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      ipTypeNeeded, // Required in schema
      industry,
      budgetRange,
      urgency,
      requesterId
    } = body;

    if (!title || !ipTypeNeeded || !requesterId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const demand = await prisma.demandRequest.create({
      data: {
        title,
        description,
        ipTypeNeeded,
        industry,
        budgetRange,
        urgency: urgency || 'Normal',
        requesterId,
        status: 'Open',
        visibility: 'Public'
      }
    });

    return NextResponse.json(demand);
  } catch (error: any) {
    console.error('API ERROR [POST /api/demand]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const industry = searchParams.get('industry');
    const ipType = searchParams.get('ipType');
    const requesterId = searchParams.get('requesterId');

    const where: any = {};

    if (requesterId) {
      // If filtering by requester, show all their demands
      where.requesterId = requesterId;
    } else {
      // Public view: only Open and Public
      where.status = 'Open';
      where.visibility = 'Public';
    }

    if (industry && industry !== 'All') where.industry = industry;
    if (ipType && ipType !== 'All') where.ipTypeNeeded = ipType;

    const demands = await prisma.demandRequest.findMany({
      where,
      include: {
        requester: {
          select: {
            name: true,
            role: true
          }
        },
        _count: {
          select: { proposals: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(demands);
  } catch (error: any) {
    console.error('API ERROR [GET /api/demand]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
