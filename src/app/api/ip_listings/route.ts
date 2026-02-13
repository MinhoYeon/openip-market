import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      title,
      summary,
      ip_type,
      industry,
      ipc,
      visibility,
      price_expectation,
      right_holders,
      owner_id
    } = body;

    // Validate required fields
    if (!title || !ip_type || !owner_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Ensure owner exists (Demo logic)
    // In a real app, this would be handled by auth middleware
    let user = await prisma.user.findUnique({ where: { id: owner_id } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          id: owner_id,
          email: 'demo@openip.market',
          name: 'Demo User',
          role: 'Owner'
        }
      });
    }

    const listing = await prisma.iPListing.create({
      data: {
        title,
        summary,
        ipType: ip_type, // Passing string directly
        industry,
        ipc,
        visibility: visibility || 'Full', // Passing string directly
        priceExpectation: price_expectation,
        ownerId: user.id,
        rightHolders: {
          create: right_holders?.map((h: any) => ({
            name: h.name,
            sharePercent: parseFloat(h.share_percent)
          })) || []
        }
      },
      include: {
        rightHolders: true
      }
    });

    return NextResponse.json(listing);
  } catch (error: any) {
    console.error('API ERROR [POST /api/ip_listings]:', error);
    return NextResponse.json({
      error: 'Internal Server Error',
      details: error.message,
      code: error.code
    }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const ownerId = searchParams.get('ownerId');
    const q = searchParams.get('q');
    const ipType = searchParams.get('ipType');
    const industry = searchParams.get('industry');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sort = searchParams.get('sort') || 'newest';

    const where: any = {};

    if (ownerId) where.ownerId = ownerId;

    if (ipType && ipType !== 'All') {
      where.ipType = ipType;
    }

    if (industry && industry !== 'All') {
      where.industry = industry;
    }

    if (q) {
      where.OR = [
        { title: { contains: q } },
        { summary: { contains: q } }
      ];
    }

    let listings = await prisma.iPListing.findMany({
      where,
      include: {
        rightHolders: true,
        owner: {
          select: {
            name: true,
            role: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc' // Default, will re-sort if needed
      }
    });

    // In-memory Price Filtering & Sorting because priceExpectation is String
    if (minPrice || maxPrice || sort) {
      listings = listings.filter(item => {
        if (!minPrice && !maxPrice) return true;
        // Naive parsing: remove commas, "KRW", spaces
        const priceStr = item.priceExpectation?.replace(/[^0-9]/g, '') || '0';
        const price = parseInt(priceStr, 10);

        if (minPrice && price < parseInt(minPrice)) return false;
        if (maxPrice && price > parseInt(maxPrice)) return false;
        return true;
      });

      if (sort === 'price_asc') {
        listings.sort((a, b) => {
          const pA = parseInt(a.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
          const pB = parseInt(b.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
          return pA - pB;
        });
      } else if (sort === 'price_desc') {
        listings.sort((a, b) => {
          const pA = parseInt(a.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
          const pB = parseInt(b.priceExpectation?.replace(/[^0-9]/g, '') || '0', 10);
          return pB - pA;
        });
      }
      // 'newest' is already handled by DB orderBy, but if we filtered, order receives stable sort
    }

    return NextResponse.json(listings);
  } catch (error: any) {
    console.error('Error fetching IP listings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
