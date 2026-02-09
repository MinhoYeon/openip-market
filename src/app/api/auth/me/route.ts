import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// GET /api/auth/me — get current session user
export async function GET() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('session_user_id')?.value;

    if (!userId) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true }
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error('API ERROR [GET /api/auth/me]:', error);
    return NextResponse.json({ user: null });
  }
}

// DELETE /api/auth/me — logout
export async function DELETE() {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('session_user_id');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API ERROR [DELETE /api/auth/me]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
