import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single demand with proposals
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const demand = await prisma.demandRequest.findUnique({
      where: { id },
      include: {
        requester: { select: { id: true, name: true, email: true, role: true } },
        proposals: {
          include: {
            proposer: { select: { id: true, name: true, role: true } },
            ipListing: { select: { id: true, title: true, ipType: true, priceExpectation: true } }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!demand) {
      return NextResponse.json({ error: 'Demand not found' }, { status: 404 });
    }

    return NextResponse.json(demand);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/demands/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update demand status
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, title, description } = body;

    const data: any = {};
    if (status) data.status = status;
    if (title) data.title = title;
    if (description) data.description = description;

    const demand = await prisma.demandRequest.update({
      where: { id },
      data,
      include: {
        requester: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(demand);
  } catch (error: any) {
    console.error(`API ERROR [PUT /api/demands/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
