import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createNotification } from '@/lib/notification';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');

  if (!userId) return NextResponse.json({ error: 'UserId required' }, { status: 400 });

  try {
    const mandates = await prisma.mandate.findMany({
      where: {
        OR: [
          { ownerId: userId },
          { brokerId: userId }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        broker: { select: { id: true, name: true, email: true } },
        ipListing: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(mandates);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { ownerId, brokerId, ipListingId, message } = body;

    // Validate inputs
    if (!ownerId || !brokerId || !ipListingId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check existing
    const existing = await prisma.mandate.findFirst({
      where: { ownerId, brokerId, ipListingId }
    });

    if (existing) {
      if (existing.status === 'Terminated' || existing.status === 'Suspended') {
        // Can re-open? For now error.
        return NextResponse.json({ error: 'Mandate already exists (status: ' + existing.status + ')' }, { status: 409 });
      }
      return NextResponse.json({ error: 'Active or Pending mandate already exists' }, { status: 409 });
    }

    // Default scope for MVP
    const defaultScope = JSON.stringify({
      negotiate: true,
      signDocuments: false,
      manageListings: true
    });

    const mandate = await prisma.mandate.create({
      data: {
        ownerId,
        brokerId,
        ipListingId,
        message,
        scope: defaultScope,
        status: 'Pending'
      }
    });

    // Notify Broker
    await createNotification(
      brokerId,
      'SYSTEM',
      `New Mandate Request from User`, // better user name if fetched
      `/mandates`
    );

    return NextResponse.json(mandate, { status: 201 });

  } catch (error: any) {
    console.error('Mandate Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
