import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20 // Limit to recent 20
    });

    return NextResponse.json(notifications);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userId, notificationIds } = body; // notificationIds: string[] or undefined (mark all)

    if (!userId) {
      return NextResponse.json({ error: 'UserId required' }, { status: 400 });
    }

    if (notificationIds && Array.isArray(notificationIds)) {
      // Mark specific read
      await prisma.notification.updateMany({
        where: {
          userId,
          id: { in: notificationIds }
        },
        data: { isRead: true }
      });
    } else {
      // Mark ALL read
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true }
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
