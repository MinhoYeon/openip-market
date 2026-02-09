import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET User Profile
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/users/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// UPDATE User Profile
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const body = await request.json();
    const { name, role } = body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        name,
        role // Ideally validated against allowed values
      }
    });

    return NextResponse.json(user);
  } catch (error: any) {
    console.error(`API ERROR [PUT /api/users/${id}]:`, error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
