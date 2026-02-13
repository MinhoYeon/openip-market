
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/settlements - List all settlements
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const whereClause: any = {};
    if (status && status !== 'All') {
      whereClause.status = status;
    }

    const settlements = await prisma.settlement.findMany({
      where: whereClause,
      include: {
        payer: { select: { name: true, email: true } },
        payee: { select: { name: true, email: true } },
        room: { select: { title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(settlements);
  } catch (error) {
    console.error('Error fetching settlements:', error);
    return NextResponse.json({ error: 'Failed to fetch settlements' }, { status: 500 });
  }
}

// PATCH /api/admin/settlements - Update settlement status (e.g. Mark as Paid)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, status, note } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'ID and status are required' }, { status: 400 });
    }

    const data: any = { status };
    if (status === 'Completed') {
      data.paidAt = new Date();
    }
    if (note) {
      data.note = note;
    }

    const settlement = await prisma.settlement.update({
      where: { id },
      data
    });

    // Optionally notify Payee here (omitted for MVP)

    return NextResponse.json(settlement);
  } catch (error) {
    console.error('Error updating settlement:', error);
    return NextResponse.json({ error: 'Failed to update settlement' }, { status: 500 });
  }
}
