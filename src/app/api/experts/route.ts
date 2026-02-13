
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/experts - List experts with optional filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const availability = searchParams.get('availability');

    const whereClause: any = {};

    if (type && type !== 'All') {
      whereClause.expertType = type;
    }

    if (availability) {
      whereClause.availability = availability;
    }

    const experts = await prisma.expertProfile.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        }
      },
      orderBy: {
        rating: 'desc'
      }
    });

    return NextResponse.json(experts);
  } catch (error) {
    console.error('Error fetching experts:', error);
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}
