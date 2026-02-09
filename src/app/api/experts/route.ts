import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all expert profiles
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expertType = searchParams.get('type');
    const availability = searchParams.get('availability');

    const where: any = {};
    if (expertType) where.expertType = expertType;
    if (availability) where.availability = availability;

    const experts = await prisma.expertProfile.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { rating: 'desc' }
    });

    return NextResponse.json(experts);
  } catch (error: any) {
    console.error('API ERROR [GET /api/experts]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create an expert profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, expertType, specializations, bio, experience, certifications, hourlyRate, projectRate } = body;

    if (!userId || !expertType) {
      return NextResponse.json({ error: 'userId and expertType are required' }, { status: 400 });
    }

    // Update user role to match expert type
    await prisma.user.update({
      where: { id: userId },
      data: { role: expertType === 'Valuator' ? 'Valuator' : 'Broker' }
    });

    const expert = await prisma.expertProfile.create({
      data: {
        userId,
        expertType,
        specializations: specializations ? JSON.stringify(specializations) : null,
        bio,
        experience,
        certifications: certifications ? JSON.stringify(certifications) : null,
        hourlyRate,
        projectRate
      },
      include: {
        user: { select: { id: true, name: true, role: true } }
      }
    });

    return NextResponse.json(expert, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/experts]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
