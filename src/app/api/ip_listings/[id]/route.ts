import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const listing = await prisma.iPListing.findUnique({
      where: { id },
      include: {
        rightHolders: true,
        owner: {
          select: {
            name: true,
            role: true,
            email: true // In a real app, you might want to hide this until NDA
          }
        }
      }
    });

    if (!listing) {
      return NextResponse.json({ error: 'IP Listing not found' }, { status: 404 });
    }

    return NextResponse.json(listing);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/ip_listings/${id}]:`, error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message
    }, { status: 500 });
  }
}
