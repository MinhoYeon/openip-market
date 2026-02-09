import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        expertProfile: true,
        listings: {
          where: { visibility: { not: 'Private' } },
          select: { id: true, title: true, summary: true, industry: true, ipType: true, priceExpectation: true }
        },
        mandatesAsBroker: {
          where: { status: 'Active' },
          include: {
            ipListing: {
              select: { id: true, title: true, summary: true, industry: true, ipType: true, priceExpectation: true }
            }
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    }

    if (user.role !== 'Broker' && user.role !== 'Valuator' && user.role !== 'Admin') {
      // Optionally restrict if user is regular owner?
      // But owners can have public profiles too? No, mainly experts.
      // For now, allow viewing anyone, but UI handles presentation.
    }

    // Combine listings
    const ownedListings = user.listings;
    const brokeredListings = user.mandatesAsBroker
      .filter(m => m.ipListing)
      .map(m => ({ ...m.ipListing, isBrokered: true }));

    const allListings = [...ownedListings, ...brokeredListings];

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email, // public? maybe hide
        role: user.role,
        createdAt: user.createdAt
      },
      profile: user.expertProfile,
      listings: allListings
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
