import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/rooms/[id]/audit — get audit logs for a room
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: roomId } = await params;

  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '100');

    const logs = await prisma.auditLog.findMany({
      where: { roomId },
      include: {
        actor: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    return NextResponse.json(logs);
  } catch (error: any) {
    console.error(`API ERROR [GET /api/rooms/${roomId}/audit]:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
