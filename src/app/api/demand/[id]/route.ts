import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const demand = await prisma.demandRequest.findUnique({
      where: { id },
      include: {
        requester: {
          select: { id: true, name: true, email: true, role: true }
        },
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
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
