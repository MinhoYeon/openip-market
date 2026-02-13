
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const license = await prisma.license.findUnique({
      where: { id },
      include: {
        ipListing: { select: { title: true } },
        licensor: { select: { id: true, name: true, email: true } },
        licensee: { select: { id: true, name: true, email: true } }
      }
    });

    if (!license) {
      return NextResponse.json({ error: 'License not found' }, { status: 404 });
    }

    return NextResponse.json(license);
  } catch (error) {
    console.error('Error fetching license:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
