import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET single settlement
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const settlement = await prisma.settlement.findUnique({
      where: { id },
      include: {
        room: { select: { id: true, title: true, type: true, status: true, ipListing: { select: { id: true, title: true } } } },
        license: true,
        payer: { select: { id: true, name: true, email: true, role: true } },
        payee: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    if (!settlement) {
      return NextResponse.json({ error: 'Settlement not found' }, { status: 404 });
    }

    return NextResponse.json(settlement);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/settlements/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT update settlement status (e.g., mark as Completed)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { status, paidAt, transactionRef, note } = body;

    const data: any = {};
    if (status) data.status = status;
    if (status === 'Completed' && !paidAt) data.paidAt = new Date();
    if (paidAt) data.paidAt = new Date(paidAt);
    if (transactionRef) data.transactionRef = transactionRef;
    if (note !== undefined) data.note = note;

    const settlement = await prisma.settlement.update({
      where: { id },
      data,
      include: {
        payer: { select: { id: true, name: true } },
        payee: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(settlement);
  } catch (error: any) {
    console.error(`API ERROR [PUT /api/settlements/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
