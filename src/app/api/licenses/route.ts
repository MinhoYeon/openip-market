import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all licenses
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const licenseType = searchParams.get('licenseType');

    const where: any = {};
    if (status) where.status = status;
    if (licenseType) where.licenseType = licenseType;

    const licenses = await prisma.license.findMany({
      where,
      include: {
        room: { select: { id: true, title: true, type: true } },
        ipListing: { select: { id: true, title: true, ipType: true } },
        licensor: { select: { id: true, name: true, role: true } },
        licensee: { select: { id: true, name: true, role: true } },
        _count: { select: { settlements: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(licenses);
  } catch (error: any) {
    console.error('API ERROR [GET /api/licenses]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a new license
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomId, ipListingId, licensorId, licenseeId, licenseType, territory, duration, royaltyRate, upfrontFee, effectiveDate, expirationDate } = body;

    if (!roomId || !ipListingId || !licensorId || !licenseeId || !licenseType) {
      return NextResponse.json(
        { error: 'roomId, ipListingId, licensorId, licenseeId, and licenseType are required' },
        { status: 400 }
      );
    }

    const license = await prisma.license.create({
      data: {
        roomId,
        ipListingId,
        licensorId,
        licenseeId,
        licenseType,
        territory,
        duration,
        royaltyRate,
        upfrontFee,
        effectiveDate: effectiveDate ? new Date(effectiveDate) : null,
        expirationDate: expirationDate ? new Date(expirationDate) : null
      },
      include: {
        room: { select: { id: true, title: true } },
        ipListing: { select: { id: true, title: true } },
        licensor: { select: { id: true, name: true } },
        licensee: { select: { id: true, name: true } }
      }
    });

    // Update IP listing status to Licensed
    await prisma.iPListing.update({
      where: { id: ipListingId },
      data: { status: 'Licensed' }
    });

    return NextResponse.json(license, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/licenses]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
