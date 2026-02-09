import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all policies
export async function GET() {
  try {
    const policies = await prisma.feePolicy.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(policies);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST create policy
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, feeType, ratePercent, applicableTo, isActive } = body;

    const policy = await prisma.feePolicy.create({
      data: {
        name,
        feeType,
        ratePercent: ratePercent ? parseFloat(ratePercent) : null,
        applicableTo, // 'Deal', 'License', 'Valuation', 'All'
        isActive: isActive !== undefined ? isActive : true
      }
    });
    return NextResponse.json(policy);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
