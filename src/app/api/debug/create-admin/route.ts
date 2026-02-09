import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const email = 'admin@openip.market';
    let admin = await prisma.user.findUnique({ where: { email } });

    if (!admin) {
      admin = await prisma.user.create({
        data: {
          email,
          name: 'Platform Admin',
          role: 'Admin',
          passwordHash: 'admin123' // simple for dev
        }
      });
      console.log('Created Admin:', admin.id);
    } else {
      // Ensure role is Admin if it was changed
      if (admin.role !== 'Admin') {
        admin = await prisma.user.update({
          where: { id: admin.id },
          data: { role: 'Admin' }
        });
      }
    }

    return NextResponse.json(admin);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
