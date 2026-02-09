import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// POST /api/ip-listings/[id]/license-proposal — submit a license proposal from IP detail page
// Creates a License Room directly with buyer and IP owner
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ipListingId } = await params;

  try {
    const body = await request.json();
    const {
      buyerId, region, termMonths, exclusivity,
      royaltyModel, priceOrRoyalty, message
    } = body;

    if (!buyerId) {
      return NextResponse.json({ error: 'buyerId is required' }, { status: 400 });
    }

    // 1. Find IP listing
    const ip = await prisma.iPListing.findUnique({
      where: { id: ipListingId },
      select: { id: true, title: true, ownerId: true, status: true }
    });

    if (!ip) {
      return NextResponse.json({ error: 'IP listing not found' }, { status: 404 });
    }

    // 2. Create License Room
    const room = await prisma.room.create({
      data: {
        title: `License: ${ip.title}`,
        type: 'License',
        ipListingId: ip.id,
        participants: {
          create: [
            { userId: ip.ownerId, role: 'Seller' },
            { userId: buyerId, role: 'Buyer' }
          ]
        }
      },
      include: {
        ipListing: { select: { id: true, title: true } },
        participants: {
          include: { user: { select: { id: true, name: true, role: true } } }
        }
      }
    });

    // 3. Create initial license record
    const license = await prisma.license.create({
      data: {
        roomId: room.id,
        ipListingId: ip.id,
        licensorId: ip.ownerId,
        licenseeId: buyerId,
        licenseType: exclusivity || 'NonExclusive',
        territory: region || null,
        duration: termMonths ? `${termMonths} months` : null,
        royaltyRate: royaltyModel || null,
        upfrontFee: priceOrRoyalty || null,
        status: 'Draft'
      }
    });

    // 4. Create initial offer from license terms
    await prisma.offer.create({
      data: {
        roomId: room.id,
        creatorId: buyerId,
        version: 1,
        price: priceOrRoyalty || null,
        terms: JSON.stringify({
          source: 'license_proposal',
          region,
          termMonths,
          exclusivity,
          royaltyModel
        }),
        message: message || '라이선스 제안',
        status: 'Sent'
      }
    });

    // 5. Update IP status
    await prisma.iPListing.update({
      where: { id: ipListingId },
      data: { status: 'UnderNegotiation' }
    });

    return NextResponse.json({ room, license }, { status: 201 });
  } catch (error: any) {
    console.error(`API ERROR [POST /api/ip-listings/${ipListingId}/license-proposal]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
