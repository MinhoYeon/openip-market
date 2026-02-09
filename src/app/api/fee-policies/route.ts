import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET all fee policies
export async function GET() {
  try {
    const policies = await prisma.feePolicy.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(policies);
  } catch (error: any) {
    console.error('API ERROR [GET /api/fee-policies]:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST create a fee policy
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, feeType, ratePercent, fixedAmount, applicableTo } = body;

    if (!name || !feeType || !applicableTo) {
      return NextResponse.json(
        { error: 'name, feeType, and applicableTo are required' },
        { status: 400 }
      );
    }

    const policy = await prisma.feePolicy.create({
      data: { name, feeType, ratePercent, fixedAmount, applicableTo }
    });

    return NextResponse.json(policy, { status: 201 });
  } catch (error: any) {
    console.error('API ERROR [POST /api/fee-policies]:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error.message }, { status: 500 });
  }
}
