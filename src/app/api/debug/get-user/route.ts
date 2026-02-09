import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const email = searchParams.get('email');

  if (!id && !email) return NextResponse.json({ error: 'ID or Email required' }, { status: 400 });

  try {
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: id || undefined },
          { email: email || undefined }
        ]
      },
      include: {
        expertProfile: true,
        listings: true,
        mandatesAsBroker: true,
        notifications: true
      }
    });

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    return NextResponse.json(user);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
