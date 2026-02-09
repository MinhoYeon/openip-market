import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, role, expertProfile } = body;

    if (!id || !role) {
      return NextResponse.json({ error: 'id and role required' }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        role,
        expertProfile: expertProfile ? {
          upsert: {
            create: expertProfile,
            update: expertProfile
          }
        } : undefined
      },
      include: { expertProfile: true }
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
