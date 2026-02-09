import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Helper to extract numeric value from "300,000 KRW"
function parseAmount(amt: string | null) {
  if (!amt) return 0;
  return parseInt(amt.replace(/[^0-9]/g, ''), 10) || 0;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { bankProfile: true } // verify user exists
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

    // Fetch settlements
    const settlements = await prisma.settlement.findMany({
      where: {
        OR: [
          { payerId: userId },
          { payeeId: userId }
        ]
      },
      orderBy: { createdAt: 'desc' },
      include: {
        payer: { select: { name: true } },
        payee: { select: { name: true } },
        room: { select: { id: true } } // link to room
      }
    });

    // Calculate totals
    let income = 0;
    let expense = 0;
    let pending = 0;

    settlements.forEach(s => {
      const amount = parseAmount(s.amount);
      const isPayee = s.payeeId === userId;

      if (s.status === 'Paid') {
        if (isPayee) income += amount;
        else expense += amount;
      } else if (s.status === 'Pending' && isPayee) {
        pending += amount;
      }
    });

    return NextResponse.json({
      bankProfile: user.bankProfile ? JSON.parse(user.bankProfile) : null,
      settlements,
      summary: { income, expense, pending }
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, bankProfile } = body;

    if (!userId || !bankProfile) {
      return NextResponse.json({ error: 'Missing logic' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        bankProfile: JSON.stringify(bankProfile)
      }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
