import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all settlements (with optional filters)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const paymentType = searchParams.get('paymentType');

    const where: any = {};
    if (status) where.status = status;
    if (paymentType) where.paymentType = paymentType;

    const settlements = await prisma.settlement.findMany({
      where,
      include: {
        room: { select: { id: true, title: true, type: true, status: true } },
        license: { select: { id: true, licenseType: true, status: true } },
        payer: { select: { id: true, name: true, role: true } },
        payee: { select: { id: true, name: true, role: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(settlements);
  } catch (error: any) {
    console.error('API ERROR [GET /api/settlements]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new settlement
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, licenseId, payerId, payeeId, amount, currency, paymentType, dueDate, note } = body;

    if (!roomId || !payerId || !payeeId || !amount || !paymentType) {
      return NextResponse.json(
        { error: 'roomId, payerId, payeeId, amount, and paymentType are required' },
        { status: 400 }
      );
    }

    const settlement = await prisma.settlement.create({
      data: {
        roomId,
        licenseId: licenseId || null,
        payerId,
        payeeId,
        amount,
        currency: currency || 'KRW',
        paymentType,
        dueDate: dueDate ? new Date(dueDate) : null,
        note
      },
      include: {
        room: { select: { id: true, title: true, type: true } },
        payer: { select: { id: true, name: true } },
        payee: { select: { id: true, name: true } }
      }
    });

    return NextResponse.json(settlement, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/settlements]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
