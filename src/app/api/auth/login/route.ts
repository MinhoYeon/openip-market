import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// POST /api/auth/login
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'email and password are required' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true, name: true, role: true, passwordHash: true, createdAt: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Verify password (demo: base64 comparison)
    const hash = Buffer.from(password).toString('base64');
    if (user.passwordHash && user.passwordHash !== hash) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session_user_id', user.id, {
      httpOnly: true,
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });

    const { passwordHash: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (error: any) {
    console.error('API ERROR [POST /api/auth/login]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
