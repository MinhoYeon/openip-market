
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/experts/profile - Get current user's profile
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const profile = await prisma.expertProfile.findUnique({
      where: { userId }
    });

    return NextResponse.json(profile || {}); // Return empty if not found, let UI handle it
  } catch (error) {
    console.error('Error fetching expert profile:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

// POST/PATCH /api/experts/profile - Create or Update profile
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      userId,
      expertType,
      specializations, // array
      bio,
      experience,
      hourlyRate,
      projectRate,
      availability
    } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Upsert the profile
    const profile = await prisma.expertProfile.upsert({
      where: { userId },
      update: {
        expertType,
        specializations: JSON.stringify(specializations || []),
        bio,
        experience,
        hourlyRate,
        projectRate,
        availability
      },
      create: {
        userId,
        expertType: expertType || 'Consultant',
        specializations: JSON.stringify(specializations || []),
        bio,
        experience,
        hourlyRate,
        projectRate,
        availability: availability || 'Available'
      }
    });

    // Also ensure user role includes "Expert" or related if not present? 
    // For now, we assume Role management is separate or user already has it.

    return NextResponse.json(profile);
  } catch (error) {
    console.error('Error saving expert profile:', error);
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
  }
}
