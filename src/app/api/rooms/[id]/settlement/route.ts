import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rooms/[id]/settlement — get settlement info for a room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const settlements = await prisma.settlement.findMany({
      where: { roomId },
      include: {
        payer: { select: { id: true, name: true, role: true } },
        payee: { select: { id: true, name: true, role: true } },
        license: { select: { id: true, licenseType: true, territory: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Get fee policies
    const feePolicies = await prisma.feePolicy.findMany({
      where: { isActive: true }
    });

    // Calculate summary
    const totalAmount = settlements.reduce((sum, s) => {
      const num = parseFloat(s.amount.replace(/[^0-9.]/g, ''));
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    const paid = settlements.filter(s => s.status === 'Completed');
    const pending = settlements.filter(s => s.status === 'Pending' || s.status === 'Processing');

    return NextResponse.json({
      settlements,
      feePolicies,
      summary: {
        totalAmount,
        paidCount: paid.length,
        pendingCount: pending.length,
        totalCount: settlements.length
      }
    });
  } catch (error: any) {
    console.error(`API ERROR [GET /api/rooms/${roomId}/settlement]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/rooms/[id]/settlement — create or update settlement actions
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const body = await request.json();
    const { action, payerId, payeeId, amount, paymentType, note, settlementId } = body;

    if (action === 'create') {
      if (!payerId || !payeeId || !amount) {
        return NextResponse.json({ error: 'payerId, payeeId, and amount are required' }, { status: 400 });
      }

      const settlement = await prisma.settlement.create({
        data: {
          roomId,
          payerId,
          payeeId,
          amount,
          paymentType: paymentType || 'Upfront',
          note,
          status: 'Pending'
        },
        include: {
          payer: { select: { id: true, name: true, role: true } },
          payee: { select: { id: true, name: true, role: true } }
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          roomId,
          actorId: payerId,
          action: 'settlementCreated',
          targetType: 'Settlement',
          targetId: settlement.id,
          detail: JSON.stringify({ amount, paymentType })
        }
      });

      return NextResponse.json(settlement, { status: 201 });
    }

    if (action === 'confirmPayment' && settlementId) {
      const updated = await prisma.settlement.update({
        where: { id: settlementId },
        data: { status: 'Completed', paidAt: new Date() }
      });
      return NextResponse.json(updated);
    }

    if (action === 'dispute' && settlementId) {
      const updated = await prisma.settlement.update({
        where: { id: settlementId },
        data: { status: 'Failed', note: note || 'Disputed' }
      });
      return NextResponse.json(updated);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/rooms/${roomId}/settlement]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
