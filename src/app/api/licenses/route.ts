
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const licenses = await prisma.license.findMany({
      where: {
        OR: [
          { licensorId: userId },
          { licenseeId: userId }
        ]
      },
      include: {
        ipListing: { select: { title: true } },
        licensor: { select: { id: true, name: true } },
        licensee: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
