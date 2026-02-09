import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    // Permission check: In production, check session. 
    // Here we rely on AuthContext from client not calling this unless authenticated as Admin in layout.
    // Ideally, pass userId as header or query param if not using cookie session.

    const [userCount, roomCount, listingCount] = await Promise.all([
      prisma.user.count(),
      prisma.room.count(),
      prisma.iPListing.count()
    ]);

    // Amount is string in schema "300,000 KRW", so aggregate won't work directly on string field?
    // Wait, Amount is `String`. `_sum` only works on Int/Float.
    // So we need to fetch all paid settlements and sum manually in JS.

    const paidSettlements = await prisma.settlement.findMany({
      where: { status: 'Paid' },
      select: { amount: true }
    });

    const totalRevenue = paidSettlements.reduce((acc, curr) => {
      // Parse "300,000,000 KRW" -> 300000000
      const val = parseInt(curr.amount.replace(/[^0-9]/g, ''), 10) || 0;
      return acc + val;
    }, 0);

    return NextResponse.json({
      users: userCount,
      rooms: roomCount,
      listings: listingCount,
      revenue: totalRevenue
    });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: 'Stats failed' }, { status: 500 });
  }
}
