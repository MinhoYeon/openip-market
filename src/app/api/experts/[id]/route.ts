
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/experts/[id] - Get public profile by userId
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params;

  try {
    const expert = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true, // Maybe hide email if privacy concerns?
        expertProfile: true,
        createdAt: true,
      }
    });

    if (!expert || !expert.expertProfile) {
      return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    }

    return NextResponse.json(expert);
  } catch (error) {
    console.error(`Error fetching expert ${userId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
